/**
 * BTW (side-thread) injection for hotmilk.
 *
 * Strips main-session harness sections, replaces append prompts, and proxies
 * context-mode/graphify tools into pi-btw sub-sessions without loading bundled
 * extensions there.
 */

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { Type } from "@sinclair/typebox";
import * as piSdk from "@earendil-works/pi-coding-agent";
import {
  createExtensionRuntime,
  defineTool,
  type CreateAgentSessionOptions,
  type ExtensionAPI,
  type ResourceLoader,
  type ToolDefinition,
} from "@earendil-works/pi-coding-agent";
import type { BundledExtensionId } from "../config/bundled-extensions.ts";
import { formatCaughtError } from "./json.ts";
import { bundledImportUrl } from "./resolve-bundled.ts";

// --- Session config (injected before btw extension loads) ---

/** Per-session config injected into the BTW extension before it loads. */
export type HotmilkBtwConfig = {
  extensionToggles: Readonly<Record<BundledExtensionId, boolean>>;
};

let activeConfig: HotmilkBtwConfig | null = null;

/** Inject the active hotmilk config for the upcoming BTW session. */
export function setHotmilkBtwConfig(config: HotmilkBtwConfig): void {
  activeConfig = config;
}

/**
 * Return the config injected by {@link setHotmilkBtwConfig}.
 * @throws when called before registration.
 */
export function getHotmilkBtwConfig(): HotmilkBtwConfig {
  if (!activeConfig) {
    throw new Error(
      "hotmilk BTW config not initialized — registerBundledExtensions must call setHotmilkBtwConfig first",
    );
  }
  return activeConfig;
}

/** Clear the active config so tests start from a clean state. */
export function resetHotmilkBtwConfigForTests(): void {
  activeConfig = null;
}

// --- Prompt shaping ---

/** Remove dynamically appended date/time/cwd footer lines from a system prompt. */
export function stripDynamicSystemPromptFooter(systemPrompt: string): string {
  return systemPrompt
    .replace(/\nCurrent date and time:[^\n]*(?:\nCurrent working directory:[^\n]*)?$/u, "")
    .replace(/\nCurrent working directory:[^\n]*$/u, "")
    .trim();
}

const MAIN_SESSION_SECTION_MARKERS = [
  /^## graphify\b/im,
  /^## el Gentleman Orchestrator\b/im,
  /^# el Gentleman Identity and Harness\b/im,
  /^<context_window_protection>/im,
  /^IMPORTANT: You are in CAVEMAN MODE\./im,
  /^## SDD Session Preflight\b/im,
  /^<behavioral_directive>/im,
] as const;

/** Strip hotmilk-specific harness sections from the main session prompt. */
export function stripHotmilkMainSessionHarness(systemPrompt: string): string {
  let next = systemPrompt;
  for (const marker of MAIN_SESSION_SECTION_MARKERS) {
    const match = marker.exec(next);
    if (!match || match.index === undefined) continue;
    next = next.slice(0, match.index).trimEnd();
  }
  return next.trim();
}

/** Base system prompt used for BTW side threads. */
export const HOTMILK_BTW_SYSTEM_PROMPT = [
  "You are having an aside conversation with the user, separate from their main working session.",
  "If main session messages are provided, they are for context only — that work is being handled by another agent.",
  "If no main session messages are provided, treat this as a fully contextless tangent thread and rely only on the user's words plus your general instructions.",
  "Focus on answering the user's side questions, helping them think through ideas, or planning next steps.",
  "Do not act as if you need to continue unfinished work from the main session unless the user explicitly asks you to prepare something for injection back to it.",
  "hotmilk routing: multi-file implementation, scout/worker/review, and SDD phases belong on the main line via subagents (Task, /run, /chain) — not in BTW.",
  "While subagents may be writing in worktrees, avoid edit/write on the main cwd unless the user explicitly asks; prefer read-only checks and :tangent for brainstorming.",
  "ctx_search is available as a read-only proxy to the main session knowledge base — use it for timeline recall, prior decisions, and indexed content. Do not use ctx_execute, ctx_batch_execute, or ctx_purge from BTW; loading context-mode here would spawn a second MCP child.",
].join(" ");

/**
 * Build the extra instructions appended to BTW sessions.
 * @param options - toggles that determine which routing hints to include
 * @returns ordered instruction lines
 */
export function buildHotmilkBtwAppendPrompt(options: {
  graphifyEnabled: boolean;
  subagentsEnabled: boolean;
  contextModeEnabled: boolean;
}): string[] {
  const lines = [HOTMILK_BTW_SYSTEM_PROMPT];
  if (options.contextModeEnabled) {
    lines.push(
      "Prefer ctx_search(queries: [...]) for session memory and indexed corpus recall instead of large bash output or re-reading raw files.",
    );
  }
  if (options.graphifyEnabled) {
    lines.push(
      'When graphify-out/graph.json exists, prefer the graphify_query tool (or `graphify query "..."` via bash) over broad grep for architecture and cross-module questions.',
    );
  }
  if (options.subagentsEnabled) {
    lines.push(
      "When the user asks for implementation or multi-file exploration, answer briefly in BTW if possible, then suggest /btw:inject plus a main-line Task — do not start parallel file edits here.",
    );
  }
  return lines;
}

const PI_BTW_APPEND_MARKERS = [
  "aside conversation with the user, separate from their main working session",
  "Summarize the side conversation concisely",
] as const;

/** BTW must never load bundled extensions (context-mode → MCP fork-bomb #516). */
function createBtwEmptyExtensionsResult() {
  return { extensions: [], errors: [], runtime: createExtensionRuntime() };
}

function isPiBtwResourceLoader(loader: ResourceLoader): boolean {
  const append = loader.getAppendSystemPrompt();
  const text = (Array.isArray(append) ? append : []).join("\n");
  return PI_BTW_APPEND_MARKERS.some((marker) => text.includes(marker));
}

function isBtwSummarizeSession(loader: ResourceLoader): boolean {
  const append = loader.getAppendSystemPrompt();
  const text = (Array.isArray(append) ? append : []).join("\n");
  return text.includes("Summarize the side conversation");
}

/**
 * Wrap a Pi resource loader so BTW gets a neutral loader: no bundled extensions,
 * a stripped system prompt, and hotmilk-tailored append instructions.
 *
 * @param loader - upstream pi-btw loader
 * @param config - hotmilk toggle config
 */
export function adaptBtwResourceLoaderForHotmilk(
  loader: ResourceLoader,
  config: HotmilkBtwConfig,
): ResourceLoader {
  const emptyExtensions = createBtwEmptyExtensionsResult();
  const sharedLoader = {
    getExtensions: () => emptyExtensions,
    getSkills: () => ({ skills: [], diagnostics: [] }),
    getPrompts: () => ({ prompts: [], diagnostics: [] }),
    getThemes: () => ({ themes: [], diagnostics: [] }),
    getAgentsFiles: () => ({ agentsFiles: [] }),
    extendResources: () => {},
    reload: async () => {},
  };

  if (isBtwSummarizeSession(loader)) {
    return {
      ...sharedLoader,
      getSystemPrompt: () => stripHotmilkMainSessionHarness(loader.getSystemPrompt() ?? ""),
      getSystemPromptSource: () => loader.getSystemPromptSource(),
      getAppendSystemPrompt: () => loader.getAppendSystemPrompt(),
      getAppendSystemPromptSources: () => loader.getAppendSystemPromptSources(),
    };
  }

  return {
    ...sharedLoader,
    getSystemPrompt: () => stripHotmilkMainSessionHarness(loader.getSystemPrompt() ?? ""),
    getSystemPromptSource: () => loader.getSystemPromptSource(),
    getAppendSystemPrompt: () =>
      buildHotmilkBtwAppendPrompt({
        graphifyEnabled: config.extensionToggles.graphify === true,
        subagentsEnabled: config.extensionToggles.subagents === true,
        contextModeEnabled: config.extensionToggles["context-mode"] === true,
      }),
    // Hotmilk synthesizes the BTW append prompt; upstream path metadata no longer applies.
    getAppendSystemPromptSources: () => [],
  };
}

// --- Main-session ctx_search capture (proxy target for BTW) ---

type MainCtxSearchTool = {
  description: string;
  parameters: ToolDefinition["parameters"];
  execute: ToolDefinition["execute"];
};

let mainCtxSearchTool: MainCtxSearchTool | null = null;
let ctxSearchCaptureInstalled = false;

/**
 * Store the main-session `ctx_search` tool definition so BTW can proxy it.
 * Ignores tools whose name is not `ctx_search`.
 */
export function captureMainCtxSearchTool(tool: {
  name: string;
  description: string;
  parameters: ToolDefinition["parameters"];
  execute: ToolDefinition["execute"];
}): void {
  if (tool.name !== "ctx_search") return;
  mainCtxSearchTool = {
    description: tool.description,
    parameters: tool.parameters,
    execute: tool.execute,
  };
}

/** @returns the captured tool, or null if none has been registered. */
export function getMainCtxSearchToolForTests(): MainCtxSearchTool | null {
  return mainCtxSearchTool;
}

/** Reset captured tool and installation guard for tests. */
export function resetMainCtxSearchCaptureForTests(): void {
  mainCtxSearchTool = null;
  ctxSearchCaptureInstalled = false;
}

async function resolveMainCtxSearchTool(): Promise<MainCtxSearchTool | null> {
  if (mainCtxSearchTool) return mainCtxSearchTool;
  try {
    const mod = await import(bundledImportUrl("context-mode/build/adapters/pi/extension.js"));
    await mod._mcpBridgeReady;
  } catch {
    return null;
  }
  return mainCtxSearchTool;
}

/**
 * Capture context-mode's main-session ctx_search registration so BTW can proxy
 * without loading context-mode inside the BTW sub-session (fork-bomb guard #516).
 */
export function installHotmilkCtxSearchCapture(pi: ExtensionAPI): void {
  if (ctxSearchCaptureInstalled) return;
  ctxSearchCaptureInstalled = true;

  const original = pi.registerTool.bind(pi);
  pi.registerTool = (tool) => {
    captureMainCtxSearchTool(tool);
    return original(tool);
  };
}

// --- Tools ---

const GRAPH_JSON = join("graphify-out", "graph.json");

const CTX_SEARCH_FALLBACK_PARAMS = Type.Object({
  queries: Type.Optional(
    Type.Array(
      Type.String({ description: "Search queries — batch all related questions in one call." }),
    ),
  ),
  query: Type.Optional(
    Type.String({ description: "Single search query (legacy alias for queries[0])." }),
  ),
  limit: Type.Optional(Type.Number({ description: "Results per query (default 3)." })),
  source: Type.Optional(
    Type.String({ description: "Filter to an indexed source label (partial match)." }),
  ),
  contentType: Type.Optional(
    Type.Union([Type.Literal("code"), Type.Literal("prose")], {
      description: "Filter by content shape.",
    }),
  ),
  sort: Type.Optional(
    Type.Union([Type.Literal("relevance"), Type.Literal("timeline")], {
      description: "relevance (default) or timeline for session memory.",
    }),
  ),
});

/** Check whether a graphify graph exists in the working directory. */
export function graphifyGraphExists(cwd = process.cwd()): boolean {
  return existsSync(join(cwd, GRAPH_JSON));
}

/**
 * Choose the base tool set exposed in BTW.
 *
 * Read-biased when subagents are enabled; otherwise keeps edit/write tools.
 *
 * @param config - hotmilk toggle config
 */
export function resolveHotmilkBtwTools(config: HotmilkBtwConfig): string[] {
  if (config.extensionToggles.subagents === true) {
    return ["read", "grep", "find", "ls", "bash"];
  }
  return ["read", "bash", "edit", "write"];
}

function createCtxSearchProxyTool(mainTool: MainCtxSearchTool | null): ToolDefinition {
  return defineTool({
    name: "ctx_search",
    label: "Search indexed content",
    description:
      mainTool?.description ??
      "Search the main session knowledge base (read-only proxy). Batch related questions in queries: [...].",
    parameters: mainTool?.parameters ?? CTX_SEARCH_FALLBACK_PARAMS,
    execute: async (toolCallId, params, signal, onUpdate, ctx) => {
      const main = await resolveMainCtxSearchTool();
      if (!main) {
        return {
          content: [
            {
              type: "text",
              text:
                "ctx_search unavailable — context-mode bridge is not ready on the main session. " +
                "Ensure context-mode is enabled, wait for startup, or use small bounded bash output.",
            },
          ],
          details: { ok: false as const },
        };
      }
      return main.execute(toolCallId, params, signal, onUpdate, ctx);
    },
  });
}

/**
 * Build BTW custom tools (`ctx_search` proxy, `graphify_query`) based on toggles.
 *
 * @param config - hotmilk toggle config
 */
export function createHotmilkBtwCustomTools(config: HotmilkBtwConfig): ToolDefinition[] {
  const tools: ToolDefinition[] = [];

  if (config.extensionToggles["context-mode"] === true) {
    tools.push(createCtxSearchProxyTool(mainCtxSearchTool));
  }

  if (config.extensionToggles.graphify !== true || !graphifyGraphExists()) {
    return tools;
  }

  const graphifyQuery = defineTool({
    name: "graphify_query",
    label: "Graphify query",
    description:
      "Traverse graphify-out/graph.json for architecture and relationship questions. Prefer this over grep for cross-module queries.",
    parameters: Type.Object({
      question: Type.String({ description: "Natural-language question about the codebase graph" }),
      dfs: Type.Optional(
        Type.Boolean({ description: "Use depth-first traversal for dependency chains" }),
      ),
      budget: Type.Optional(
        Type.Number({ description: "Optional token budget cap for the graphify answer" }),
      ),
    }),
    execute: async (_toolCallId, params, _signal, _onUpdate, ctx) => {
      const args = ["query", params.question, "--graph", GRAPH_JSON];
      if (params.dfs) args.push("--dfs");
      if (params.budget !== undefined) args.push("--budget", String(params.budget));

      try {
        const output = execFileSync("graphify", args, {
          cwd: ctx.cwd,
          encoding: "utf8",
          maxBuffer: 512 * 1024,
          timeout: 120_000,
        });
        return {
          content: [{ type: "text", text: output.trim() || "(graphify returned no output)" }],
          details: { question: params.question, ok: true as const },
        };
      } catch (cause) {
        const message = formatCaughtError(cause);
        return {
          content: [
            {
              type: "text",
              text: `graphify query failed: ${message}. Ensure graphify-out/graph.json exists or run graphify on the main session.`,
            },
          ],
          details: { question: params.question, ok: false as const, error: message },
        };
      }
    },
  });

  tools.push(graphifyQuery);
  return tools;
}

function patchHotmilkBtwSessionOptions(
  options: CreateAgentSessionOptions,
): CreateAgentSessionOptions {
  const loader = options.resourceLoader;
  if (!loader || !isPiBtwResourceLoader(loader)) {
    return options;
  }

  const config = getHotmilkBtwConfig();
  const summarize = isBtwSummarizeSession(loader);
  const next: CreateAgentSessionOptions = {
    ...options,
    resourceLoader: adaptBtwResourceLoaderForHotmilk(loader, config),
  };

  if (!summarize) {
    next.tools = resolveHotmilkBtwTools(config);
    next.customTools = createHotmilkBtwCustomTools(config);
  }

  return next;
}

let btwHookInstalled = false;

/**
 * Wrap Pi {@link createAgentSession} so pi-btw sub-sessions get hotmilk prompts/tools
 * without vendoring the upstream extension (~2k lines).
 */
export function installHotmilkBtwSessionHook(): void {
  if (btwHookInstalled) return;
  btwHookInstalled = true;

  const original = piSdk.createAgentSession.bind(piSdk);
  const patched = async (options?: CreateAgentSessionOptions) => {
    const resolved = options ? patchHotmilkBtwSessionOptions(options) : options;
    return original(resolved);
  };
  // SAFETY: createAgentSession is a mutable export we wrap once at process start.
  (piSdk as { createAgentSession: typeof patched }).createAgentSession = patched;
}
