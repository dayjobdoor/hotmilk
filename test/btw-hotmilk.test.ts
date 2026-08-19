import { beforeEach, describe, expect, it } from "vite-plus/test";
import {
  adaptBtwResourceLoaderForHotmilk,
  buildHotmilkBtwAppendPrompt,
  captureMainCtxSearchTool,
  createHotmilkBtwCustomTools,
  installHotmilkCtxSearchCapture,
  resetMainCtxSearchCaptureForTests,
  resolveHotmilkBtwTools,
  stripHotmilkMainSessionHarness,
  type HotmilkBtwConfig,
} from "../src/bootstrap/btw.ts";
import type { BundledExtensionId } from "../src/config/bundled-extensions.ts";
import { BUNDLED_EXTENSION_IDS } from "../src/config/hotmilk.ts";
import { createExtensionRuntime } from "@earendil-works/pi-coding-agent";
import type { ResourceLoader } from "@earendil-works/pi-coding-agent";
import type { JsonObject } from "../src/json.ts";

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

  it("adds ctx_search proxy when context-mode is on", () => {
    const tools = createHotmilkBtwCustomTools(
      hotmilkBtwConfig({ "context-mode": true, graphify: false }),
    );
    expect(tools.map((t) => t.name)).toEqual(["ctx_search"]);
  });

  it("ctx_search proxy delegates to the main session tool", async () => {
    captureMainCtxSearchTool({
      name: "ctx_search",
      description: "main ctx_search",
      parameters: { type: "object", properties: {} },
      execute: async () => ({
        content: [{ type: "text", text: "indexed hit" }],
        details: { ok: true },
      }),
    });

    const [proxy] = createHotmilkBtwCustomTools(
      hotmilkBtwConfig({ "context-mode": true, graphify: false }),
    );
    const result = await proxy.execute(
      "call-1",
      { queries: ["decision"] },
      undefined,
      undefined,
      // SAFETY: test double implements only the cwd field used by execute.
      { cwd: process.cwd() } as never,
    );

    expect(result.content[0]).toMatchObject({ type: "text", text: "indexed hit" });
  });

  it("installHotmilkCtxSearchCapture stores ctx_search from registerTool", () => {
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
    pi.registerTool({
      name: "ctx_search",
      description: "captured",
      parameters: { type: "object", properties: {} },
      execute: async () => ({ content: [{ type: "text", text: "ok" }], details: {} }),
    });
    expect(registered).toEqual(["ctx_search"]);
    expect(
      createHotmilkBtwCustomTools(hotmilkBtwConfig({ "context-mode": true, graphify: false }))[0]
        ?.description,
    ).toBe("captured");
  });
});
