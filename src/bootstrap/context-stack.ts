import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { getAgentDir } from "@earendil-works/pi-coding-agent";
import { pruneContextModeMcpServerFromAgentConfig } from "../config/mcp.ts";
import type { HotmilkRuntime } from "../config/runtime.ts";
import type { BundledExtensionId } from "../config/hotmilk.ts";

const RTK_EXTENSION_DIR = "pi-rtk-optimizer";
const RTK_CONFIG_FILENAME = "config.json";

export function getRtkOptimizerConfigPath(): string {
  return `${getAgentDir()}/extensions/${RTK_EXTENSION_DIR}/${RTK_CONFIG_FILENAME}`;
}

export function expectedRtkMode(contextModeEnabled: boolean): "suggest" | "rewrite" {
  return contextModeEnabled ? "suggest" : "rewrite";
}

/** Defaults when hotmilk seeds pi-rtk-optimizer config for the first time. */
export function buildHotmilkRtkConfig(contextModeEnabled: boolean): Record<string, unknown> {
  return {
    enabled: true,
    mode: expectedRtkMode(contextModeEnabled),
    guardWhenRtkMissing: true,
    showRewriteNotifications: false,
    outputCompaction: {
      enabled: true,
      stripAnsi: true,
      readCompaction: { enabled: false },
      truncate: { enabled: true, maxChars: 12_000 },
      sourceCodeFilteringEnabled: false,
      preserveExactSkillReads: true,
      sourceCodeFiltering: "none",
      smartTruncate: { enabled: false, maxLines: 220 },
      aggregateTestOutput: true,
      filterBuildOutput: true,
      compactGitOutput: true,
      aggregateLinterOutput: true,
      groupSearchOutput: true,
      trackSavings: true,
    },
  };
}

type RtkConfigRecord = Record<string, unknown> & {
  mode?: string;
  outputCompaction?: {
    readCompaction?: { enabled?: boolean };
  };
};

function writeRtkConfig(configPath: string, config: unknown): void {
  writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

export function seedRtkConfigIfMissing(
  contextModeEnabled: boolean,
  configPath = getRtkOptimizerConfigPath(),
): { seeded: boolean; path: string } {
  if (existsSync(configPath)) {
    return { seeded: false, path: configPath };
  }

  mkdirSync(dirname(configPath), { recursive: true });
  writeRtkConfig(configPath, buildHotmilkRtkConfig(contextModeEnabled));
  return { seeded: true, path: configPath };
}

/** Hotmilk-managed fields only — does not touch Pi auto-compaction (settings.json). */
function alignRtkConfigWithContextMode(
  config: RtkConfigRecord,
  contextModeEnabled: boolean,
): boolean {
  let changed = false;
  const mode = expectedRtkMode(contextModeEnabled);
  if (config.mode !== mode) {
    config.mode = mode;
    changed = true;
  }

  if (contextModeEnabled && config.outputCompaction?.readCompaction?.enabled !== false) {
    config.outputCompaction ??= {};
    config.outputCompaction.readCompaction = { enabled: false };
    changed = true;
  }

  return changed;
}

export function syncRtkConfigForContextStack(
  contextModeEnabled: boolean,
  rtkEnabled: boolean,
  configPath = getRtkOptimizerConfigPath(),
): { updated: boolean; seeded: boolean; path: string } {
  if (!rtkEnabled) {
    return { updated: false, seeded: false, path: configPath };
  }

  if (!existsSync(configPath)) {
    seedRtkConfigIfMissing(contextModeEnabled, configPath);
    return { updated: true, seeded: true, path: configPath };
  }

  const config = JSON.parse(readFileSync(configPath, "utf8")) as RtkConfigRecord;
  const changed = alignRtkConfigWithContextMode(config, contextModeEnabled);
  if (changed) {
    writeRtkConfig(configPath, config);
  }

  return { updated: changed, seeded: false, path: configPath };
}

/** Run before bundled extensions register (rtk seed/sync when that toggle is on). */
export function prepareContextStack(extensionToggles: Record<BundledExtensionId, boolean>): void {
  if (extensionToggles["rtk-optimizer"]) {
    syncRtkConfigForContextStack(extensionToggles["context-mode"], true);
  }
}

const MCP_PRUNED_MESSAGE = (path: string): string =>
  `Removed duplicate context-mode entry from ${path}. ctx_* tools use the extension bridge only.`;

const MCP_ADAPTER_DUPLICATE_WARNING =
  "context-mode runs on the extension bridge (ctx_*). Do not add a context-mode server to mcp.json — use mcp-adapter only for other MCP servers.";

const RTK_SYNC_MESSAGE =
  "Adjusted pi-rtk-optimizer for context-mode coexistence (mode/readCompaction). Pi auto-compaction unchanged.";

/**
 * Option A: context-mode extension owns ctx_* via built-in MCP bridge.
 * Prune legacy `context-mode` MCP server entries whenever the extension is enabled.
 */
export function applyContextStackOnSessionStart(
  runtime: HotmilkRuntime,
  notify: (message: string, level: "info" | "warning") => void,
): void {
  const { extensionToggles } = runtime;
  const contextModeEnabled = extensionToggles["context-mode"];

  if (extensionToggles["rtk-optimizer"]) {
    const sync = syncRtkConfigForContextStack(contextModeEnabled, true);
    if (sync.updated && !sync.seeded) {
      notify(RTK_SYNC_MESSAGE, "info");
    }
  }

  if (!contextModeEnabled) {
    return;
  }

  const mcpPrune = pruneContextModeMcpServerFromAgentConfig();
  if (mcpPrune.pruned) {
    notify(MCP_PRUNED_MESSAGE(mcpPrune.path), "info");
  }

  if (extensionToggles["mcp-adapter"]) {
    notify(MCP_ADAPTER_DUPLICATE_WARNING, "warning");
  }
}
