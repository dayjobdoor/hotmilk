import { beforeEach, describe, expect, it } from "vite-plus/test";
import {
  adaptBtwResourceLoaderForHotmilk,
  buildHotmilkBtwAppendPrompt,
  captureMainCtxSearchTool,
  createHotmilkBtwCustomTools,
  graphifyGraphExists,
  installHotmilkCtxSearchCapture,
  resetMainCtxSearchCaptureForTests,
  resolveHotmilkBtwTools,
  stripHotmilkMainSessionHarness,
  HOTMILK_BTW_SYSTEM_PROMPT,
  type HotmilkBtwConfig,
} from "../src/bootstrap/btw.ts";
import type { BundledExtensionId } from "../src/config/bundled-extensions.ts";
import { BUNDLED_EXTENSION_IDS } from "../src/config/hotmilk.ts";
import { createExtensionRuntime } from "@earendil-works/pi-coding-agent";
import type { ResourceLoader } from "@earendil-works/pi-coding-agent";
import type { JsonObject } from "../src/bootstrap/json.ts";

function hotmilkBtwConfig(
  overrides: Partial<Record<BundledExtensionId, boolean>> = {},
): HotmilkBtwConfig {
  // SAFETY: test fixture starts every bundled id at false.
  const extensionToggles = {} as Record<BundledExtensionId, boolean>;
  for (const id of BUNDLED_EXTENSION_IDS) {
    extensionToggles[id] = false;
  }
  return {
    extensionToggles: {
      ...extensionToggles,
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
  it("strips harness sections inherited from the main session", () => {
    const prompt = [
      "Project rules stay.",
      "## graphify",
      "Read graphify-out first.",
      "## el Gentleman Orchestrator",
      "Delegate everything.",
    ].join("\n");

    expect(stripHotmilkMainSessionHarness(prompt)).toBe("Project rules stay.");
  });

  it.each([
    "## graphify",
    "## el Gentleman Orchestrator",
    "# el Gentleman Identity and Harness",
    "<context_window_protection>",
    "IMPORTANT: You are in CAVEMAN MODE.",
    "## SDD Session Preflight",
    "<behavioral_directive>",
  ])("strips each supported harness marker: %s", (marker) => {
    const prompt = ["Project rules stay.", marker, "harness content", "User rules"].join("\n");

    expect(stripHotmilkMainSessionHarness(prompt)).toBe("Project rules stay.");
  });

  it("keeps optional routing instructions absent when toggles are off", () => {
    expect(
      buildHotmilkBtwAppendPrompt({
        graphifyEnabled: false,
        subagentsEnabled: false,
        contextModeEnabled: false,
      }),
    ).toEqual([HOTMILK_BTW_SYSTEM_PROMPT]);
  });

  it("append prompt mentions graphify and subagents routing when enabled", () => {
    const append = buildHotmilkBtwAppendPrompt({
      graphifyEnabled: true,
      subagentsEnabled: true,
      contextModeEnabled: true,
    }).join("\n");
    expect(append).toContain("graphify_query");
    expect(append).toContain("subagents");
    expect(append).toContain("ctx_search");
  });

  it("adaptBtwResourceLoader strips harness and replaces BTW append", () => {
    const loader = mockPiBtwLoader([
      "You are having an aside conversation with the user, separate from their main working session.",
    ]);
    const adapted = adaptBtwResourceLoaderForHotmilk(loader, hotmilkBtwConfig());
    expect(adapted.getSystemPrompt()).toBe("Project rules stay.");
    expect(adapted.getAppendSystemPrompt().join("\n")).toContain("hotmilk routing");
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
  it("preserves upstream append prompt for BTW summaries", () => {
    const upstreamAppend = ["Summarize the side conversation", "Keep it concise."];
    const loader = mockPiBtwLoader(upstreamAppend);
    const adapted = adaptBtwResourceLoaderForHotmilk(loader, hotmilkBtwConfig());

    expect(adapted.getAppendSystemPrompt()).toEqual(upstreamAppend);
    expect(adapted.getAppendSystemPromptSources()).toEqual([
      { path: "/tmp/mock-append-0.md" },
      { path: "/tmp/mock-append-1.md" },
    ]);
  });
});

describe("hotmilk btw tools", () => {
  it("uses read-biased tools when subagents are on", () => {
    expect(resolveHotmilkBtwTools(hotmilkBtwConfig({ subagents: true }))).toEqual([
      "read",
      "grep",
      "find",
      "ls",
      "bash",
    ]);
  });

  it("keeps upstream coding tools when subagents are off", () => {
    expect(resolveHotmilkBtwTools(hotmilkBtwConfig({ subagents: false }))).toEqual([
      "read",
      "bash",
      "edit",
      "write",
    ]);
  });

  it("skips graphify_query custom tool when graphify toggle is off", () => {
    expect(
      createHotmilkBtwCustomTools(hotmilkBtwConfig({ graphify: false, "context-mode": false })),
    ).toEqual([]);
  });

  it("adds graphify_query when graphify is enabled and graph data exists", () => {
    expect(graphifyGraphExists()).toBe(true);
    const tools = createHotmilkBtwCustomTools(
      hotmilkBtwConfig({ graphify: true, "context-mode": false }),
    );

    expect(tools.map((tool) => tool.name)).toEqual(["graphify_query"]);
  });

  it("adds ctx_search proxy when context-mode is on", () => {
    const tools = createHotmilkBtwCustomTools(
      hotmilkBtwConfig({ "context-mode": true, graphify: false }),
    );
    expect(tools.map((t) => t.name)).toEqual(["ctx_search"]);
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
