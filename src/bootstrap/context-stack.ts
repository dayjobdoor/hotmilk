/**
 * pi-rtk-optimizer / context-mode coexistence seam.
 *
 * With context-mode on, hotmilk forces two fields of pi-rtk-optimizer's
 * `config.json`: `mode = suggest` and `outputCompaction.readCompaction.enabled =
 * false`. Without context-mode an existing config is left alone (the mode is the
 * user's call); a missing one is seeded with the `rewrite` default. Everything
 * else is the user's. The sync runs once, before bundled extensions load; its result is
 * reported at session start.
 */

import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { getAgentDir } from "@earendil-works/pi-coding-agent";
import { formatCaughtError, isJsonObject, parseJsonValue, type JsonObject } from "./json.ts";
import type { BundledExtensionId } from "../config/bundled-extensions.ts";

/** Outcome of one rtk config sync. */
export type RtkSync = {
  path: string;
  outcome: "seeded" | "updated" | "unchanged" | "failed";
  error?: string;
};

function defaultRtkConfig(contextModeEnabled: boolean): JsonObject {
  return {
    enabled: true,
    mode: contextModeEnabled ? "suggest" : "rewrite",
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

/** Result of {@link alignRtkConfig}: the config to keep and whether it differs from the input. */
type RtkAlignment = { config: JsonObject; changed: boolean };

/**
 * Pure: `existing` with the coexistence fields forced when context-mode is on,
 * untouched otherwise, or the hotmilk default when there is no config yet.
 */
export function alignRtkConfig(existing: JsonObject | undefined, contextModeEnabled: boolean): RtkAlignment {
  if (!existing) return { config: defaultRtkConfig(contextModeEnabled), changed: true };
  let config = existing;
  if (contextModeEnabled && config.mode !== "suggest") config = { ...config, mode: "suggest" };
  const current = config.outputCompaction;
  const output = current !== undefined && isJsonObject(current) ? current : {};
  const readCompaction = output.readCompaction;
  const readCompactionOff =
    readCompaction !== undefined && isJsonObject(readCompaction) && readCompaction.enabled === false;
  if (contextModeEnabled && !readCompactionOff) {
    config = { ...config, outputCompaction: { ...output, readCompaction: { enabled: false } } };
  }
  return { config, changed: config !== existing };
}

function parseRtkConfig(text: string): JsonObject {
  const parsed = parseJsonValue(text);
  if (!isJsonObject(parsed)) throw new Error("rtk config must be a JSON object");
  return parsed;
}

/** Align pi-rtk-optimizer's `config.json` on disk; failures are returned, never thrown. */
export function syncRtkConfig(
  contextModeEnabled: boolean,
  configPath = join(getAgentDir(), "extensions", "pi-rtk-optimizer", "config.json"),
): RtkSync {
  try {
    const existing = existsSync(configPath) ? parseRtkConfig(readFileSync(configPath, "utf8")) : undefined;
    const { config, changed } = alignRtkConfig(existing, contextModeEnabled);
    if (!changed) return { path: configPath, outcome: "unchanged" };
    mkdirSync(dirname(configPath), { recursive: true });
    // Temp file + rename: a crash or full disk must not leave a truncated user config.
    const temp = `${configPath}.${process.pid}.tmp`;
    writeFileSync(temp, `${JSON.stringify(config, null, 2)}\n`, "utf8");
    renameSync(temp, configPath);
    return { path: configPath, outcome: existing ? "updated" : "seeded" };
  } catch (error) {
    return { path: configPath, outcome: "failed", error: formatCaughtError(error) };
  }
}

/** Sync the rtk config before bundled extensions register (only when `rtk-optimizer` is on). */
export function prepareContextStack(
  extensionToggles: Record<BundledExtensionId, boolean>,
): RtkSync | undefined {
  return extensionToggles["rtk-optimizer"] ? syncRtkConfig(extensionToggles["context-mode"]) : undefined;
}
