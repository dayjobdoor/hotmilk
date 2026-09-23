import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vite-plus/test";
import {
  adaptBtwResourceLoaderForHotmilk,
  buildHotmilkBtwAppendPrompt,
  captureMainCtxSearchTool,
  createHotmilkBtwCustomTools,
  graphifyGraphExists,
  installHotmilkCtxSearchCapture,
  resetMainCtxSearchCaptureForTests,
  resolveHotmilkBtwToolNames,
  stripHotmilkMainSessionHarness,
  HOTMILK_BTW_SYSTEM_PROMPT,
  type HotmilkBtwConfig,
} from "../src/bootstrap/btw.ts";
import type { BundledExtensionId } from "../src/config/bundled-extensions.ts";
import { allExtensionsDisabled } from "./fixtures/runtime.ts";
import { createExtensionRuntime } from "@earendil-works/pi-coding-agent";
import type { ResourceLoader } from "@earendil-works/pi-coding-agent";
import type { JsonObject } from "../src/bootstrap/json.ts";
import { makeTempDir } from "./fixtures/tmp.ts";

function hotmilkBtwConfig(
  overrides: Partial<Record<BundledExtensionId, boolean>> = {},
): HotmilkBtwConfig {
  return {
    extensionToggles: {
      ...allExtensionsDisabled(),
      btw: true,
      subagents: true,
      graphify: true,
      "gentle-ai": true,
      ...overrides,
    },
  };
}

function mockPiBtwLoader(append: string[]): ResourceLoader {
  const extensionsResult = { extensions: [], errors: [], runtime: createExtensionRuntime() };
  return {
    getExtensions: () => extensionsResult,
    getSkills: () => ({ skills: [], diagnostics: [] }),
    getPrompts: () => ({ prompts: [], diagnostics: [] }),
    getThemes: () => ({ themes: [], diagnostics: [] }),
    getAgentsFiles: () => ({ agentsFiles: [] }),
    getSystemPrompt: () => "Project rules stay.\n## graphify\nDelegate.",
    getSystemPromptSource: () => ({ path: "/tmp/mock-system-prompt.md" }),
    getAppendSystemPrompt: () => append,
    getAppendSystemPromptSources: () =>
      append.map((_, i) => ({ path: `/tmp/mock-append-${i}.md` })),
    extendResources: () => {},
    reload: async () => {},
  };
}

beforeEach(() => {
  resetMainCtxSearchCaptureForTests();
});

describe("hotmilk btw prompt", () => {
  it("strips every supported harness marker section", () => {
    const markers = [
      "## graphify",
      "## el Gentleman Orchestrator",
      "# el Gentleman Identity and Harness",
      "<context_window_protection>",
      "IMPORTANT: You are in CAVEMAN MODE.",
      "## SDD Session Preflight",
      "<behavioral_directive>",
    ];
    for (const marker of markers) {
      const prompt = ["Project rules stay.", marker, "harness content", "User rules"].join("\n");

      expect(stripHotmilkMainSessionHarness(prompt), `marker: ${marker}`).toBe(
        "Project rules stay.",
      );
    }

    // Real main-session prompts stack several harness sections; stripping starts
    // at the first one.
    const stacked = [
      "Project rules stay.",
      "## graphify",
      "Read graphify-out first.",
      "## el Gentleman Orchestrator",
      "Delegate everything.",
    ].join("\n");
    expect(stripHotmilkMainSessionHarness(stacked)).toBe("Project rules stay.");
  });

  it("append prompt adds routing only for enabled toggles", () => {
    expect(
      buildHotmilkBtwAppendPrompt({
        graphifyEnabled: false,
        subagentsEnabled: false,
        contextModeEnabled: false,
      }),
    ).toEqual([HOTMILK_BTW_SYSTEM_PROMPT]);

    // Discriminating phrases from each toggle's own line; the base prompt always
    // mentions ctx_search/subagents, so bare tokens cannot prove the toggle wiring.
    const append = buildHotmilkBtwAppendPrompt({
      graphifyEnabled: true,
      subagentsEnabled: true,
      contextModeEnabled: true,
    }).join("\n");
    expect(append).toContain("Prefer ctx_search(queries:");
    expect(append).toContain("graphify_query");
    expect(append).toContain("/btw:inject");

    // Graphify alone must not pull in the other two routing lines.
    const graphifyOnly = buildHotmilkBtwAppendPrompt({
      graphifyEnabled: true,
      subagentsEnabled: false,
      contextModeEnabled: false,
    }).join("\n");
    expect(graphifyOnly).toContain("graphify_query");
    expect(graphifyOnly).not.toContain("Prefer ctx_search(queries:");
    expect(graphifyOnly).not.toContain("/btw:inject");
  });

  it("adaptBtwResourceLoader strips the harness, replaces the main-session append, and preserves the BTW summarize append", () => {
    const mainLoader = mockPiBtwLoader([
      "You are having an aside conversation with the user, separate from their main working session.",
    ]);
    const mainAdapted = adaptBtwResourceLoaderForHotmilk(mainLoader, hotmilkBtwConfig());
    expect(mainAdapted.getSystemPrompt()).toBe("Project rules stay.");
    expect(mainAdapted.getAppendSystemPrompt().join("\n")).toContain("hotmilk routing");

    const summarizeAppend = ["Summarize the side conversation", "Keep it concise."];
    const summarizeLoader = mockPiBtwLoader(summarizeAppend);
    const summarizeAdapted = adaptBtwResourceLoaderForHotmilk(summarizeLoader, hotmilkBtwConfig());
    expect(summarizeAdapted.getAppendSystemPrompt()).toEqual(summarizeAppend);
    expect(summarizeAdapted.getAppendSystemPromptSources()).toEqual([
      { path: "/tmp/mock-append-0.md" },
      { path: "/tmp/mock-append-1.md" },
    ]);
  });

  it("adaptBtwResourceLoader never exposes bundled extensions even if upstream loader had them", () => {
    const loader = mockPiBtwLoader([
      "You are having an aside conversation with the user, separate from their main working session.",
    ]);

    const upstreamExtensions = loader.getExtensions();
    // SAFETY: test fixture injects an invalid value to prove fallback.
    upstreamExtensions.extensions.push({ id: "context-mode" } as never);

    const adapted = adaptBtwResourceLoaderForHotmilk(loader, hotmilkBtwConfig());
    expect(adapted.getExtensions().extensions).toEqual([]);
  });
});

describe("hotmilk btw tools", () => {
  it("tool surface follows the toggles: built-in set from subagents, custom tools from graphify and context-mode", () => {
    expect(resolveHotmilkBtwToolNames(hotmilkBtwConfig({ subagents: true }))).toEqual([
      "read",
      "grep",
      "find",
      "ls",
      "bash",
    ]);
    expect(resolveHotmilkBtwToolNames(hotmilkBtwConfig({ subagents: false }))).toEqual([
      "read",
      "bash",
      "edit",
      "write",
    ]);
    expect(
      createHotmilkBtwCustomTools(hotmilkBtwConfig({ graphify: false, "context-mode": false })),
    ).toEqual([]);
    expect(
      createHotmilkBtwCustomTools(hotmilkBtwConfig({ "context-mode": true, graphify: false })).map(
        (tool) => tool.name,
      ),
    ).toEqual(["ctx_search"]);

    const cwd = makeTempDir("hotmilk-btw-graph-");
    mkdirSync(join(cwd, "graphify-out"), { recursive: true });
    writeFileSync(join(cwd, "graphify-out", "graph.json"), "{}", "utf8");
    expect(graphifyGraphExists(cwd)).toBe(true);
    expect(
      createHotmilkBtwCustomTools(hotmilkBtwConfig({ graphify: true, "context-mode": false }), cwd).map(
        (tool) => tool.name,
      ),
    ).toEqual(["graphify_query"]);
  });

  it("ctx_search proxy forwards the main session call", async () => {
    const params = { queries: ["decision"] };
    const signal = new AbortController().signal;
    const onUpdate = () => {};
    const ctx = { cwd: process.cwd() };
    let received: unknown[] = [];

    captureMainCtxSearchTool({
      name: "ctx_search",
      description: "main ctx_search",
      parameters: { type: "object", properties: {} },
      execute: async (toolCallId, passedParams, passedSignal, passedOnUpdate, passedCtx) => {
        received = [toolCallId, passedParams, passedSignal, passedOnUpdate, passedCtx];
        return {
          content: [{ type: "text", text: "indexed hit" }],
          details: { ok: true },
        };
      },
    });

    const [proxy] = createHotmilkBtwCustomTools(
      hotmilkBtwConfig({ "context-mode": true, graphify: false }),
    );
    // SAFETY: test context only supplies cwd, which proxy forwards unchanged.
    const result = await proxy.execute("call-1", params, signal, onUpdate, ctx as never);

    expect(result.content[0]).toMatchObject({ type: "text", text: "indexed hit" });
    expect(received).toEqual(["call-1", params, signal, onUpdate, ctx]);
  });

  it("installHotmilkCtxSearchCapture forwards tools and captures ctx_search once", () => {
    type CapturedTool = {
      name: string;
      description?: string;
      parameters?: JsonObject;
      execute?: () => Promise<JsonObject>;
    };
    const registered: string[] = [];
    const pi = {
      registerTool: (tool: CapturedTool) => {
        registered.push(tool.name);
      },
    };

    // SAFETY: test double implements only registerTool.
    installHotmilkCtxSearchCapture(pi as never);
    // SAFETY: idempotent installation keeps same registerTool contract.
    installHotmilkCtxSearchCapture(pi as never);
    pi.registerTool({
      name: "other",
      description: "ignored",
      parameters: { type: "object", properties: {} },
      execute: async () => ({ content: [{ type: "text", text: "other" }], details: {} }),
    });
    pi.registerTool({
      name: "ctx_search",
      description: "captured",
      parameters: { type: "object", properties: {} },
      execute: async () => ({ content: [{ type: "text", text: "ok" }], details: {} }),
    });

    expect(registered).toEqual(["other", "ctx_search"]);
    expect(
      createHotmilkBtwCustomTools(hotmilkBtwConfig({ "context-mode": true, graphify: false }))[0]
        ?.description,
    ).toBe("captured");
  });
});
