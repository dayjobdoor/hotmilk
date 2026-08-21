/**
 * RTK-optimizer / context-mode coexistence bootstrap.
 *
 * Seeds and synchronizes pi-rtk-optimizer config so it works alongside
 * context-mode, and prunes stale context-mode MCP server entries.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { getAgentDir } from "@earendil-works/pi-coding-agent";
import {
  formatCaughtError,
  isJsonBoolean,
  isJsonObject,
  isJsonString,
  parseJsonValue,
  type JsonValue,
} from "./json.ts";
import { pruneContextModeMcpServerFromAgentConfig } from "../config/mcp.ts";
import type { HotmilkRuntime } from "../config/runtime.ts";
import type { BundledExtensionId } from "../config/hotmilk.ts";

const RTK_EXTENSION_DIR = "pi-rtk-optimizer";
const RTK_CONFIG_FILENAME = "config.json";

/** @returns the absolute path to pi-rtk-optimizer's `config.json`. */
export function getRtkOptimizerConfigPath(): string {
  return `${getAgentDir()}/extensions/${RTK_EXTENSION_DIR}/${RTK_CONFIG_FILENAME}`;
}

/**
 * Decide the RTK mode that best coexists with context-mode.
 *
 * @returns `"suggest"` when context-mode is on, `"rewrite"` otherwise.
 */
export function expectedRtkMode(contextModeEnabled: boolean): "suggest" | "rewrite" {
  return contextModeEnabled ? "suggest" : "rewrite";
}

export type HotmilkRtkConfig = {
  enabled: boolean;
  mode: "suggest" | "rewrite";
  guardWhenRtkMissing: boolean;
  showRewriteNotifications: boolean;
  outputCompaction: {
    enabled: boolean;
    stripAnsi: boolean;
    readCompaction: { enabled: boolean };
    truncate: { enabled: boolean; maxChars: number };
    sourceCodeFilteringEnabled: boolean;
    preserveExactSkillReads: boolean;
    sourceCodeFiltering: string;
    smartTruncate: { enabled: boolean; maxLines: number };
    aggregateTestOutput: boolean;
    filterBuildOutput: boolean;
    compactGitOutput: boolean;
    aggregateLinterOutput: boolean;
    groupSearchOutput: boolean;
    trackSavings: boolean;
  };
};

export type SeedRtkResult = {
  seeded: boolean;
  path: string;
  error?: string;
};

export type SyncRtkResult = {
  updated: boolean;
  seeded: boolean;
  path: string;
  error?: string;
};

type MutableJsonObject = { [key: string]: JsonValue };

/**
 * Build the default pi-rtk-optimizer config shaped for hotmilk.
 *
 * @param contextModeEnabled - whether context-mode is toggled on
 */
export function buildHotmilkRtkConfig(contextModeEnabled: boolean): HotmilkRtkConfig {
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

function writeRtkConfig(configPath: string, config: HotmilkRtkConfig | MutableJsonObject): void {
  writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

function parseRtkConfigRecord(text: string) {
  const parsed = parseJsonValue(text);
  if (!isJsonObject(parsed)) {
    throw new Error("rtk config must be an object");
  }
  const config: MutableJsonObject = {};
  for (const key of Object.keys(parsed)) {
    config[key] = parsed[key];
  }
  return config;
}

function rtkModeOf(config: MutableJsonObject): string | undefined {
  return isJsonString(config.mode) ? config.mode : undefined;
}

function readCompactionEnabled(config: MutableJsonObject): boolean | undefined {
  if (!isJsonObject(config.outputCompaction)) {
    return undefined;
  }
  if (!isJsonObject(config.outputCompaction.readCompaction)) {
    return undefined;
  }
  const enabled = config.outputCompaction.readCompaction.enabled;
  return isJsonBoolean(enabled) ? enabled : undefined;
}

export function seedRtkConfigIfMissing(
  contextModeEnabled: boolean,
  configPath = getRtkOptimizerConfigPath(),
): SeedRtkResult {
  if (existsSync(configPath)) {
    return { seeded: false, path: configPath };
  }

  try {
    mkdirSync(dirname(configPath), { recursive: true });
    writeRtkConfig(configPath, buildHotmilkRtkConfig(contextModeEnabled));
    return { seeded: true, path: configPath };
  } catch (error) {
    return {
      seeded: false,
      path: configPath,
      error: formatCaughtError(error),
    };
  }
}

/** Hotmilk-managed fields only — does not touch Pi auto-compaction (settings.json). */
function alignRtkConfigWithContextMode(
  config: MutableJsonObject,
  contextModeEnabled: boolean,
): boolean {
  let changed = false;
  const mode = expectedRtkMode(contextModeEnabled);
  if (rtkModeOf(config) !== mode) {
    config.mode = mode;
    changed = true;
  }

  if (contextModeEnabled && readCompactionEnabled(config) !== false) {
    const output = isJsonObject(config.outputCompaction) ? { ...config.outputCompaction } : {};
    output.readCompaction = { enabled: false };
    config.outputCompaction = output;
    changed = true;
  }

  return changed;
}

export function syncRtkConfigForContextStack(
  contextModeEnabled: boolean,
  rtkEnabled: boolean,
  configPath = getRtkOptimizerConfigPath(),
): SyncRtkResult {
  if (!rtkEnabled) {
    return { updated: false, seeded: false, path: configPath };
  }

  if (!existsSync(configPath)) {
    const seeded = seedRtkConfigIfMissing(contextModeEnabled, configPath);
    if (seeded.error) {
      return { updated: false, seeded: false, path: configPath, error: seeded.error };
    }
    return { updated: true, seeded: true, path: configPath };
  }

  try {
    const config = parseRtkConfigRecord(readFileSync(configPath, "utf8"));
    const changed = alignRtkConfigWithContextMode(config, contextModeEnabled);
    if (changed) {
      writeRtkConfig(configPath, config);
    }

    return { updated: changed, seeded: false, path: configPath };
  } catch (error) {
    return {
      updated: false,
      seeded: false,
      path: configPath,
      error: formatCaughtError(error),
    };
  }
}

/**
 * Eagerly seed/sync RTK config before bundled extensions register.
 *
 * @param extensionToggles - resolved bundled-extension toggle state
 */
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
