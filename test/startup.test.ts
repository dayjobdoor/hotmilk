import * as fs from "node:fs";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import * as path from "node:path";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { parseJsonValue } from "../src/bootstrap/json.ts";
import * as resolveBundled from "../src/bootstrap/resolve-bundled.ts";
import { HOTMILK_AUTORESEARCH_FULLSCREEN_SHORTCUT } from "../src/bootstrap/autoresearch.ts";
import { prepareContextStack } from "../src/bootstrap/context-stack.ts";
import { OMP_AUDITED_VERSION } from "../src/config/bundled-extensions.ts";
import { createHotmilkRuntime } from "../src/config/runtime.ts";
import { allExtensionsDisabled, testRuntime, withConfigEnv } from "./fixtures/runtime.ts";
import { registerDefaultsHandlers } from "../src/bootstrap/defaults.ts";
import { registerGraphHandlers } from "../src/bootstrap/graph.ts";
import {
  detectProjectAgentDefinitions,
  registerSessionHandlers,
  sessionStartNotices,
} from "../src/bootstrap/session.ts";
import registerHotmilk from "../src/index.ts";
import { makeTempDir } from "./fixtures/tmp.ts";
import { registrationOrder, resetRegistrationOrder } from "./fixtures/order-marker-state.ts";

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

afterEach(() => {
  vi.restoreAllMocks();
  resetRegistrationOrder();
});

describe("startup registration", () => {
  it("registers trust and session handlers plus input commands with all bundles off", async () => {
    const configRoot = makeTempDir("hotmilk-startup-config-");
    const agentDir = makeTempDir("hotmilk-startup-agent-");
    await withConfigEnv(configRoot, agentDir, async () => {
      writeFileSync(
        join(configRoot, "hotmilk.json"),
        JSON.stringify({
          extensions: allExtensionsDisabled(),
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
      expect(commands).toEqual(["stop", "interrupt", "mode", "pioneer"]);
      expect(existsSync(join(agentDir, "extensions", "pi-autoresearch.json"))).toBe(false);
    });
  });

  const STARTUP_STUB_MODULES: ReadonlySet<string> = new Set([
    "gentle-pi/extensions/gentle-agents.ts",
    "pi-autoresearch/extensions/pi-autoresearch/index.ts",
  ]);

  it("wires enabled toggles: bundle load, autoresearch seed", async () => {
    const configRoot = makeTempDir("hotmilk-startup-config-on-");
    const agentDir = makeTempDir("hotmilk-startup-agent-on-");
    const originalImportUrl = resolveBundled.bundledImportUrl;
    await withConfigEnv(configRoot, agentDir, async () => {
      const toggles = allExtensionsDisabled();
      toggles["context-mode"] = true;
      toggles.autoresearch = true;
      toggles.subagents = true;
      writeFileSync(
        join(configRoot, "hotmilk.json"),
        JSON.stringify({
          extensions: toggles,
          graph: { warnOnStale: false, autoSuggestUpdate: false },
        }),
        "utf8",
      );

      // SAFETY: module namespace spy; heavy bundled imports are redirected to local fixtures.
      vi.spyOn(resolveBundled, "bundledImportUrl").mockImplementation((relativePath) => {
        if (relativePath === "context-mode/build/adapters/pi/extension.js") {
          return new URL("./fixtures/order-marker-context-mode.ts", import.meta.url).href;
        }
        if (STARTUP_STUB_MODULES.has(relativePath)) {
          return new URL("./fixtures/noop-bundled.ts", import.meta.url).href;
        }
        return originalImportUrl(relativePath);
      });

      const events: string[] = [];
      const commands: string[] = [];
      const registeredTools: { name: string }[] = [];
      const pi = {
        on: (event: string) => {
          events.push(event);
        },
        registerCommand: (name: string) => {
          commands.push(name);
        },
        registerTool: (tool: { name: string }) => {
          registeredTools.push(tool);
        },
      };
      // SAFETY: fake pi exposes only members the all-off path proved sufficient.
      await registerHotmilk(pi as never);

      expect(registrationOrder).toEqual(["context-mode"]);
      expect(commands).toEqual(["stop", "interrupt", "mode", "pioneer"]);
      expect(events).toEqual(["project_trust", "session_start"]);
      expect(registeredTools.map((tool) => tool.name)).toEqual(["ctx_search"]);
      expect(
        parseJsonValue(readFileSync(join(agentDir, "extensions", "pi-autoresearch.json"), "utf8")),
      ).toEqual({
        shortcuts: { fullscreenDashboard: HOTMILK_AUTORESEARCH_FULLSCREEN_SHORTCUT },
      });
    });
  });

  it("npm-installed copy yields inside the hotmilk checkout but registers in normal projects", async () => {
    const configRoot = makeTempDir("hotmilk-startup-config-npm-");
    const agentDir = makeTempDir("hotmilk-startup-agent-npm-");
    const selfPath = path.join(agentDir, "npm", "node_modules", "hotmilk", "src", "index.ts");
    const recordingFakePi = () => {
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
      return { pi, events, commands };
    };

    // Inside a hotmilk checkout the npm-installed copy must yield before any
    // registration. The checkout fixture mirrors this repo's manifest/settings
    // shape; the repo's real .pi/settings.json is gitignored so tests must not
    // depend on it.
    const checkout = makeTempDir("hotmilk-startup-checkout-");
    fs.mkdirSync(join(checkout, ".pi"), { recursive: true });
    writeFileSync(
      join(checkout, "package.json"),
      JSON.stringify({ name: "hotmilk", pi: { extensions: ["./src/index.ts"] } }),
      "utf8",
    );
    writeFileSync(
      join(checkout, ".pi", "settings.json"),
      JSON.stringify({ packages: [".."], extensions: ["../src"] }),
      "utf8",
    );
    await withConfigEnv(undefined, agentDir, async () => {
      const { pi, events, commands } = recordingFakePi();
      // SAFETY: fake API is never touched; the npm-installed copy must return
      // before any registration when the session cwd is a hotmilk checkout.
      await registerHotmilk(pi as never, { selfPath, cwd: checkout });
      expect(events).toEqual([]);
      expect(commands).toEqual([]);
    });

    // In a normal project the same copy registers the default surface.
    const projectCwd = makeTempDir("hotmilk-startup-project-");
    await withConfigEnv(configRoot, agentDir, async () => {
      writeFileSync(
        join(configRoot, "hotmilk.json"),
        JSON.stringify({
          extensions: allExtensionsDisabled(),
          graph: { warnOnStale: false, autoSuggestUpdate: false },
        }),
        "utf8",
      );
      const { pi, events, commands } = recordingFakePi();
      // SAFETY: fake API implements only methods used by the all-bundles-off startup path.
      await registerHotmilk(pi as never, { selfPath, cwd: projectCwd });
      expect(events).toEqual(["project_trust", "session_start"]);
      expect(commands).toEqual(["stop", "interrupt", "mode", "pioneer"]);
    });
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

    // Persona section content itself is pinned by caveman-defaults.test.ts.
    expect(result.systemPrompt).toContain("Current persona mode: gyal");
    expect(result.systemPrompt).toContain("Prefer responding in ja");
    expect(result.systemPrompt).toContain("keep routing");
    expect(result.systemPrompt).not.toContain("built-in neutral rules");
  });
});

describe("registerGraphHandlers", () => {
  it("wires the stale-graph handler per warnOnStale and gates guidance on autoSuggestUpdate", () => {
    const cwd = makeTempDir("hotmilk-graph-");
    mkdirSync(join(cwd, "graphify-out"));
    writeFileSync(join(cwd, "graphify-out", "needs_update"), "", "utf8");

    // warnOnStale: false registers no handler at all.
    let registered = false;
    // SAFETY: fake API implements the registration method under the disabled branch.
    registerGraphHandlers({ on: () => (registered = true) } as never, {
      warnOnStale: false,
      autoSuggestUpdate: true,
    });
    expect(registered).toBe(false);

    // warnOnStale: true warns; autoSuggestUpdate controls the update guidance.
    const notifications: NotifyCall[] = [];
    let handler: GraphHandler | undefined;
    const pi = { on: (_event: string, next: GraphHandler) => (handler = next) };
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

    const noSuggestNotifications: NotifyCall[] = [];
    let noSuggestHandler: GraphHandler | undefined;
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
});

describe("registerSessionHandlers", () => {
  it("seeds missing config and notifies at session start", async () => {
    const configRoot = makeTempDir("hotmilk-session-config-");
    await withConfigEnv(configRoot, undefined, async () => {
      let handler: SessionHandler | undefined;
      const notifications: NotifyCall[] = [];
      const pi = { on: (_event: string, next: SessionHandler) => (handler = next) };
      const cwd = makeTempDir("hotmilk-session-cwd-");

      // SAFETY: fake API implements the session-start registration method.
      registerSessionHandlers(pi as never, testRuntime());
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
    });
  });

  it("tells an upgraded user once which default-on rows are now off", async () => {
    const configRoot = makeTempDir("hotmilk-default-off-");
    await withConfigEnv(configRoot, undefined, async () => {
      // A 0.1.x config: saved before most rows existed, so it has no value for them.
      writeFileSync(
        join(configRoot, "hotmilk.json"),
        JSON.stringify({ extensions: { btw: true }, graph: { warnOnStale: false } }),
        "utf8",
      );
      const cwd = makeTempDir("hotmilk-default-off-cwd-");
      const startSession = (): NotifyCall[] => {
        let handler: SessionHandler | undefined;
        const notifications: NotifyCall[] = [];
        const pi = { on: (_event: string, next: SessionHandler) => (handler = next) };
        // SAFETY: fake API implements the session-start registration method.
        registerSessionHandlers(pi as never, createHotmilkRuntime(configRoot, "pi"));
        handler?.(
          {},
          {
            hasUI: false,
            cwd,
            ui: { notify: (message, level) => notifications.push({ message, level }) },
            isProjectTrusted: () => false,
          },
        );
        return notifications;
      };

      const first = startSession();
      expect(first).toEqual([
        { message: expect.stringContaining("skill-registry"), level: "info" },
      ]);
      expect(first[0]?.message).not.toContain("btw"); // btw has a saved value
      // The marker is written without losing the user's other settings...
      expect(parseJsonValue(readFileSync(join(configRoot, "hotmilk.json"), "utf8"))).toMatchObject({
        extensions: { btw: true },
        graph: { warnOnStale: false },
        notices: { defaultOff020: true },
      });
      // ...and the notice does not come back.
      expect(startSession()).toEqual([]);
    });
  });

  it("builds config, dedupe, omp harness, context-stack, caveman, and kanagawa notices (pure)", () => {
    const extensionToggles = allExtensionsDisabled();
    extensionToggles.caveman = true;
    extensionToggles.kanagawa = true;
    const runtime = testRuntime({
      configError: "Invalid JSON",
      harness: "omp",
      harnessVersion: "99.0.0",
      harnessSkips: ["todo", "btw"],
      globalExtensionSkips: [{ id: "graphify", packageName: "graphify-pi" }],
      extensionToggles,
      defaults: { persona: "neutral", language: "ja" },
      rtkSync: { path: "/a/rtk.json", outcome: "updated" },
    });

    const notices = sessionStartNotices(runtime, {
      seededPath: "~/.omp/agent/hotmilk.json",
      projectSkips: [{ id: "lens", packageName: "pi-lens" }],
    });

    expect(notices.map(({ message }) => message)).toEqual([
      expect.stringContaining("Created ~/.omp/agent/hotmilk.json"),
      expect.stringContaining("Failed to parse"),
      expect.stringContaining("pi-only bundled extensions skipped (not flagged omp in the registry): todo, btw"),
      expect.stringContaining("omp 99.0.0 is not the audited release"),
      expect.stringContaining("Adjusted pi-rtk-optimizer"),
      expect.stringContaining("graphify: global graphify-pi"),
      expect.stringContaining("lens: project pi-lens"),
      expect.stringContaining("caveman is on while defaults.language is ja"),
      expect.stringContaining("kanagawa is on"),
    ]);
  });

  it("stays silent when there is nothing to report (pi, aligned rtk, omp on the audited release)", () => {
    const none = { projectSkips: [] };
    expect(sessionStartNotices(testRuntime(), none)).toEqual([]);
    expect(sessionStartNotices(testRuntime({ rtkSync: { path: "/a", outcome: "unchanged" } }), none)).toEqual([]);
    expect(
      sessionStartNotices(testRuntime({ harness: "omp", harnessVersion: OMP_AUDITED_VERSION }), none),
    ).toEqual([]);
  });

  it("reports a failed rtk sync with its path and error instead of swallowing it", () => {
    const notices = sessionStartNotices(
      testRuntime({ rtkSync: { path: "/a/rtk.json", outcome: "failed", error: "EACCES" } }),
      { projectSkips: [] },
    );
    expect(notices).toEqual([
      { message: expect.stringContaining("Could not sync pi-rtk-optimizer config at /a/rtk.json: EACCES"), level: "warning" },
    ]);
  });

  it("names a bundled row that failed to load, with its error", () => {
    const notices = sessionStartNotices(
      testRuntime({ extensionFailures: [{ id: "graphify", message: "Cannot find module" }] }),
      { projectSkips: [] },
    );
    expect(notices).toEqual([
      { message: expect.stringContaining("graphify: Cannot find module"), level: "warning" },
    ]);
  });

  it("names untrusted project agent definitions only when subagents is on", () => {
    const agents = { projectSkips: [], untrustedProjectAgents: [".pi/agents/"] };
    const subagentsOn = allExtensionsDisabled();
    subagentsOn.subagents = true;

    expect(sessionStartNotices(testRuntime({ extensionToggles: subagentsOn }), agents)).toEqual([
      { message: expect.stringContaining(".pi/agents/"), level: "warning" },
    ]);
    expect(sessionStartNotices(testRuntime(), agents)).toEqual([]);
  });

  it("detects project subagent definitions only when markdown agents or a config exist", () => {
    const cwd = makeTempDir("hotmilk-project-agents-");
    expect(detectProjectAgentDefinitions(cwd)).toEqual([]);
    mkdirSync(join(cwd, ".pi", "agents"), { recursive: true });
    expect(detectProjectAgentDefinitions(cwd)).toEqual([]); // empty dir is not a definition
    writeFileSync(join(cwd, ".pi", "agents", "scout.md"), "---\nname: scout\n---\n", "utf8");
    writeFileSync(join(cwd, ".pi", "subagents.json"), "{}", "utf8");
    expect(detectProjectAgentDefinitions(cwd)).toEqual([".pi/agents/", ".pi/subagents.json"]);
  });

  it("reports the pre-load rtk sync at session start", async () => {
    const configRoot = makeTempDir("hotmilk-session-context-config-");
    const agentDir = makeTempDir("hotmilk-session-context-agent-");
    await withConfigEnv(configRoot, agentDir, async () => {
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

      const extensionToggles = allExtensionsDisabled();
      extensionToggles["context-mode"] = true;
      extensionToggles["rtk-optimizer"] = true;
      const notifications: NotifyCall[] = [];
      let handler: SessionHandler | undefined;
      // The entry syncs rtk before bundles load and stores the result on the runtime.
      const runtime = testRuntime({ extensionToggles });
      runtime.rtkSync = prepareContextStack(extensionToggles);
      // SAFETY: fake API implements the session-start registration contract.
      registerSessionHandlers(
        { on: (_event: string, next: SessionHandler) => (handler = next) } as never,
        runtime,
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

      // The alignment itself is pinned by context-stack.test.ts; this asserts the session-level outcome.
      expect(notifications.map(({ message }) => message)).toEqual([
        expect.stringContaining("Adjusted pi-rtk-optimizer"),
      ]);
      expect(parseJsonValue(readFileSync(rtkPath, "utf8"))).toMatchObject({ mode: "suggest" });
    });
  });

  it("seeds the gentle-ai marker per trust, reconciles stale markers, and skips gentleman", async () => {
    const configRoot = makeTempDir("hotmilk-persona-config-");
    await withConfigEnv(configRoot, undefined, async () => {
      writeFileSync(join(configRoot, "hotmilk.json"), "{}", "utf8");
      const extensionToggles = allExtensionsDisabled();
      extensionToggles["gentle-ai"] = true;
      let handler: SessionHandler | undefined;
      const pi = { on: (_event: string, next: SessionHandler) => (handler = next) };

      // SAFETY: fake API implements the session-start registration method.
      registerSessionHandlers(
        pi as never,
        testRuntime({ extensionToggles, defaults: { persona: "gyal" } }),
      );
      const runSession = (cwd: string, trusted: boolean) =>
        handler?.(
          {},
          {
            hasUI: false,
            cwd,
            ui: { notify: () => {} },
            isProjectTrusted: () => trusted,
          },
        );

      // Untrusted projects never get a marker.
      const untrustedCwd = makeTempDir("hotmilk-persona-untrusted-");
      runSession(untrustedCwd, false);
      expect(existsSync(join(untrustedCwd, ".pi", "gentle-ai", "persona.json"))).toBe(false);

      // Trusted projects get the marker mapped onto gentle-pi's binary mode.
      const trustedCwd = makeTempDir("hotmilk-persona-trusted-");
      runSession(trustedCwd, true);
      // SAFETY: JSON.parse returns any; asserting only the fields we compare.
      const seeded = JSON.parse(
        readFileSync(join(trustedCwd, ".pi", "gentle-ai", "persona.json"), "utf8"),
      ) as { mode?: unknown; hotmilkMode?: unknown };
      expect(seeded).toEqual({ mode: "neutral", hotmilkMode: "gyal" });

      // A stale marker (wrong persona) is rewritten to the configured default.
      const staleCwd = makeTempDir("hotmilk-persona-stale-");
      const staleMarker = join(staleCwd, ".pi", "gentle-ai", "persona.json");
      mkdirSync(dirname(staleMarker), { recursive: true });
      writeFileSync(staleMarker, JSON.stringify({ mode: "gentleman" }), "utf8");
      runSession(staleCwd, true);
      // SAFETY: JSON.parse returns any; asserting the fields syncPersonaFileFromDefaults writes.
      const reconciled = JSON.parse(readFileSync(staleMarker, "utf8")) as {
        mode?: unknown;
        hotmilkMode?: unknown;
      };
      expect(reconciled).toEqual({ mode: "neutral", hotmilkMode: "gyal" });

      // The built-in default (gentleman) never writes a marker at all.
      const defaultCwd = makeTempDir("hotmilk-persona-default-");
      // SAFETY: fake API implements the session-start registration method.
      registerSessionHandlers(
        pi as never,
        testRuntime({ extensionToggles, defaults: { persona: "gentleman" } }),
      );
      handler?.(
        {},
        {
          hasUI: false,
          cwd: defaultCwd,
          ui: { notify: () => {} },
          isProjectTrusted: () => true,
        },
      );
      expect(existsSync(join(defaultCwd, ".pi", "gentle-ai", "persona.json"))).toBe(false);
    });
  });
});
