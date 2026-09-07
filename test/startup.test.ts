import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import type { HotmilkRuntime } from "../src/config/runtime.ts";
import { parseJsonValue } from "../src/bootstrap/json.ts";
import { BUNDLED_EXTENSION_IDS, type BundledExtensionId } from "../src/config/hotmilk.ts";
import { registerDefaultsHandlers } from "../src/bootstrap/defaults.ts";
import { registerGraphHandlers } from "../src/bootstrap/graph.ts";
import { registerSessionHandlers } from "../src/bootstrap/session.ts";
import registerHotmilk from "../src/index.ts";
import { makeTempDir } from "./fixtures/tmp.ts";

type NotifyCall = { message: string; level: "info" | "warning" };
type StartupEvent = Record<string, never>;
type SessionContext = {
  hasUI: boolean;
  cwd: string;
  ui: { notify(message: string, level: "info" | "warning"): void };
  isProjectTrusted(): boolean;
};
type SessionHandler = (_event: StartupEvent, ctx: SessionContext) => void;
type GraphContext = { cwd: string; ui: { notify(message: string, level: "warning"): void } };
type GraphHandler = (_event: StartupEvent, ctx: GraphContext) => void;
type BeforeAgentStartHandler = (event: { systemPrompt: string }) => Promise<{
  systemPrompt: string;
}>;

function disabledExtensions(): Record<BundledExtensionId, boolean> {
  // SAFETY: every registry id is assigned exactly once by this map.
  return Object.fromEntries(BUNDLED_EXTENSION_IDS.map((id) => [id, false])) as Record<
    BundledExtensionId,
    boolean
  >;
}

function runtime(overrides: Partial<HotmilkRuntime> = {}): HotmilkRuntime {
  return {
    configPath: "/tmp/hotmilk.json",
    extensionToggles: disabledExtensions(),
    globalExtensionSkips: [],
    defaults: { persona: "neutral" },
    graph: { warnOnStale: false, autoSuggestUpdate: false },
    projectTrust: { mode: "delegate", remember: false },
    ...overrides,
  };
}

function setEnv(name: string, value: string): () => void {
  const previous = process.env[name];
  process.env[name] = value;
  return () => {
    if (previous === undefined) delete process.env[name];
    else process.env[name] = previous;
  };
}

describe("startup registration", () => {
  it("registers trust and session handlers plus input commands with all bundles off", async () => {
    const configRoot = makeTempDir("hotmilk-startup-config-");
    const agentDir = makeTempDir("hotmilk-startup-agent-");
    const restoreConfigRoot = setEnv("HOTMILK_CONFIG_ROOT", configRoot);
    const restoreAgentDir = setEnv("PI_CODING_AGENT_DIR", agentDir);
    try {
      writeFileSync(
        join(configRoot, "hotmilk.json"),
        JSON.stringify({
          extensions: Object.fromEntries(BUNDLED_EXTENSION_IDS.map((id) => [id, false])),
          graph: { warnOnStale: false, autoSuggestUpdate: false },
        }),
        "utf8",
      );
      const events: string[] = [];
      const commands: string[] = [];
      const pi = {
        on(event: string) {
          events.push(event);
        },
        registerCommand(name: string) {
          commands.push(name);
        },
      };

      // SAFETY: fake API implements only methods used by the all-bundles-off startup path.
      await registerHotmilk(pi as never);

      expect(events).toEqual(["project_trust", "session_start"]);
      expect(commands).toEqual(["stop", "interrupt", "mode"]);
    } finally {
      restoreConfigRoot();
      restoreAgentDir();
    }
  });
});

describe("registerDefaultsHandlers", () => {
  it("injects configured persona and language into before_agent_start", async () => {
    let handler: BeforeAgentStartHandler | undefined;
    const pi = {
      on: (_event: string, next: BeforeAgentStartHandler) => {
        handler = next;
      },
    };

    // SAFETY: fake API implements the before_agent_start registration contract.
    registerDefaultsHandlers(pi as never, { persona: "gyal", language: "ja" });

    const result = await handler!({
      systemPrompt: [
        "Current persona mode: neutral",
        "",
        "Persona:",
        "- built-in neutral rules",
        "",
        "Harness principles:",
        "- keep routing",
      ].join("\n"),
    });

    expect(result.systemPrompt).toContain("Current persona mode: gyal");
    expect(result.systemPrompt).toContain("bright, confident Japanese gyal");
    expect(result.systemPrompt).toContain("Prefer responding in ja");
    expect(result.systemPrompt).toContain("keep routing");
    expect(result.systemPrompt).not.toContain("built-in neutral rules");
  });
});

describe("registerGraphHandlers", () => {
  it("warns with update guidance when the graph needs an update", () => {
    const cwd = makeTempDir("hotmilk-graph-");
    mkdirSync(join(cwd, "graphify-out"));
    writeFileSync(join(cwd, "graphify-out", "needs_update"), "", "utf8");
    let handler: GraphHandler | undefined;
    const pi = { on: (_event: string, next: GraphHandler) => (handler = next) };
    const notifications: NotifyCall[] = [];

    // SAFETY: fake API implements the registration method under test.
    registerGraphHandlers(pi as never, { warnOnStale: true, autoSuggestUpdate: true });
    handler?.(
      {},
      {
        cwd,
        ui: { notify: (message, level) => notifications.push({ message, level }) },
      },
    );

    expect(notifications).toHaveLength(1);
    expect(notifications[0]).toMatchObject({
      message: expect.stringContaining("Run `graphify update .`"),
      level: "warning",
    });
    let noSuggestHandler: GraphHandler | undefined;
    const noSuggestNotifications: NotifyCall[] = [];
    // SAFETY: fake API implements the graph registration contract.
    registerGraphHandlers(
      { on: (_event: string, next: GraphHandler) => (noSuggestHandler = next) } as never,
      { warnOnStale: true, autoSuggestUpdate: false },
    );
    noSuggestHandler?.(
      {},
      {
        cwd,
        ui: {
          notify: (message, level) => noSuggestNotifications.push({ message, level }),
        },
      },
    );
    expect(noSuggestNotifications).toEqual([
      { message: expect.not.stringContaining("graphify update"), level: "warning" },
    ]);
  });

  it("does not register a stale-graph handler when warnings are disabled", () => {
    let registered = false;
    // SAFETY: fake API implements the registration method under the disabled branch.
    registerGraphHandlers({ on: () => (registered = true) } as never, {
      warnOnStale: false,
      autoSuggestUpdate: true,
    });

    expect(registered).toBe(false);
  });
});

describe("registerSessionHandlers", () => {
  it("seeds missing config and notifies at session start", () => {
    const configRoot = makeTempDir("hotmilk-session-config-");
    const restoreConfigRoot = setEnv("HOTMILK_CONFIG_ROOT", configRoot);
    try {
      let handler: SessionHandler | undefined;
      const notifications: NotifyCall[] = [];
      const pi = { on: (_event: string, next: SessionHandler) => (handler = next) };
      const cwd = makeTempDir("hotmilk-session-cwd-");

      // SAFETY: fake API implements the session-start registration method.
      registerSessionHandlers(pi as never, runtime());
      handler?.(
        {},
        {
          hasUI: false,
          cwd,
          ui: { notify: (message, level) => notifications.push({ message, level }) },
          isProjectTrusted: () => false,
        },
      );

      expect(existsSync(join(configRoot, "hotmilk.json"))).toBe(true);
      expect(notifications).toHaveLength(1);
      expect(notifications[0]).toMatchObject({
        message: expect.stringContaining("Created"),
        level: "info",
      });
    } finally {
      restoreConfigRoot();
    }
  });

  it("reports config, skip, caveman, and kanagawa warnings at session start", () => {
    const configRoot = makeTempDir("hotmilk-session-warnings-config-");
    const agentDir = makeTempDir("hotmilk-session-warnings-agent-");
    const restoreConfigRoot = setEnv("HOTMILK_CONFIG_ROOT", configRoot);
    const restoreAgentDir = setEnv("PI_CODING_AGENT_DIR", agentDir);
    try {
      writeFileSync(join(configRoot, "hotmilk.json"), "{}", "utf8");
      const extensionToggles = disabledExtensions();
      extensionToggles.caveman = true;
      extensionToggles.kanagawa = true;
      const notifications: NotifyCall[] = [];
      let handler: SessionHandler | undefined;

      // SAFETY: fake API implements the session-start registration contract.
      registerSessionHandlers(
        { on: (_event: string, next: SessionHandler) => (handler = next) } as never,
        runtime({
          configError: "Invalid JSON",
          globalExtensionSkips: [{ id: "graphify", packageName: "graphify-pi" }],
          extensionToggles,
          defaults: { persona: "neutral", language: "ja" },
        }),
      );
      handler?.(
        {},
        {
          hasUI: false,
          cwd: makeTempDir("hotmilk-session-warnings-cwd-"),
          ui: { notify: (message, level) => notifications.push({ message, level }) },
          isProjectTrusted: () => false,
        },
      );

      expect(notifications).toHaveLength(4);
      expect(notifications.map(({ message }) => message)).toEqual(
        expect.arrayContaining([
          expect.stringContaining("Failed to parse"),
          expect.stringContaining("graphify: global graphify-pi"),
          expect.stringContaining("caveman is on while defaults.language is ja"),
          expect.stringContaining("kanagawa is on"),
        ]),
      );
    } finally {
      restoreConfigRoot();
      restoreAgentDir();
    }
  });

  it("applies context-stack synchronization and MCP cleanup at session start", () => {
    const configRoot = makeTempDir("hotmilk-session-context-config-");
    const agentDir = makeTempDir("hotmilk-session-context-agent-");
    const restoreConfigRoot = setEnv("HOTMILK_CONFIG_ROOT", configRoot);
    const restoreAgentDir = setEnv("PI_CODING_AGENT_DIR", agentDir);
    try {
      writeFileSync(join(configRoot, "hotmilk.json"), "{}", "utf8");
      const rtkPath = join(agentDir, "extensions", "pi-rtk-optimizer", "config.json");
      mkdirSync(join(agentDir, "extensions", "pi-rtk-optimizer"), { recursive: true });
      writeFileSync(
        rtkPath,
        JSON.stringify({
          mode: "rewrite",
          outputCompaction: { readCompaction: { enabled: true } },
        }),
        "utf8",
      );
      const mcpPath = join(agentDir, "mcp.json");
      writeFileSync(
        mcpPath,
        JSON.stringify({
          mcpServers: {
            "context-mode": { command: "context-mode" },
            other: { command: "other" },
          },
        }),
        "utf8",
      );

      const extensionToggles = disabledExtensions();
      extensionToggles["context-mode"] = true;
      extensionToggles["rtk-optimizer"] = true;
      extensionToggles["mcp-adapter"] = true;
      const notifications: NotifyCall[] = [];
      let handler: SessionHandler | undefined;
      // SAFETY: fake API implements the session-start registration contract.
      registerSessionHandlers(
        { on: (_event: string, next: SessionHandler) => (handler = next) } as never,
        runtime({ extensionToggles }),
      );
      handler?.(
        {},
        {
          hasUI: false,
          cwd: makeTempDir("hotmilk-session-context-cwd-"),
          ui: { notify: (message, level) => notifications.push({ message, level }) },
          isProjectTrusted: () => false,
        },
      );

      expect(parseJsonValue(readFileSync(rtkPath, "utf8"))).toMatchObject({
        mode: "suggest",
        outputCompaction: { readCompaction: { enabled: false } },
      });
      expect(parseJsonValue(readFileSync(mcpPath, "utf8"))).toEqual({
        mcpServers: { other: { command: "other" } },
      });
      expect(notifications.map(({ message }) => message)).toEqual(
        expect.arrayContaining([
          expect.stringContaining("Adjusted pi-rtk-optimizer"),
          expect.stringContaining("Removed duplicate context-mode entry"),
          expect.stringContaining("Do not add a context-mode server"),
        ]),
      );
    } finally {
      restoreConfigRoot();
      restoreAgentDir();
    }
  });

  it("seeds persona files only for trusted projects", () => {
    const configRoot = makeTempDir("hotmilk-persona-config-");
    const restoreConfigRoot = setEnv("HOTMILK_CONFIG_ROOT", configRoot);
    try {
      writeFileSync(join(configRoot, "hotmilk.json"), "{}", "utf8");
      const cwd = makeTempDir("hotmilk-persona-cwd-");
      const extensionToggles = disabledExtensions();
      extensionToggles["gentle-ai"] = true;
      const settings = runtime({
        extensionToggles,
        defaults: { persona: "gyal" },
      });
      let handler: SessionHandler | undefined;
      const pi = { on: (_event: string, next: SessionHandler) => (handler = next) };

      // SAFETY: fake API implements the session-start registration method.
      registerSessionHandlers(pi as never, settings);

      handler?.(
        {},
        {
          hasUI: false,
          cwd,
          ui: { notify: () => {} },
          isProjectTrusted: () => false,
        },
      );
      expect(existsSync(join(cwd, ".pi", "gentle-ai", "persona.json"))).toBe(false);

      handler?.(
        {},
        {
          hasUI: false,
          cwd,
          ui: { notify: () => {} },
          isProjectTrusted: () => true,
        },
      );
      expect(existsSync(join(cwd, ".pi", "gentle-ai", "persona.json"))).toBe(true);
    } finally {
      restoreConfigRoot();
    }
  });
});
