/**
 * hotmilk user configuration loading and defaults.
 *
 * Reads/writes `~/.pi/agent/hotmilk.json` and derives the in-memory default
 * config from the bundled `hotmilk.json` template.
 */

import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveBundledExtensionToggles } from "./resolve.ts";
import { BUNDLED_EXTENSION_IDS, type BundledExtensionId } from "./bundled-extensions.ts";

const PACKAGE_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const BUNDLED_TEMPLATE_PATH = join(PACKAGE_ROOT, "hotmilk.json");

function isPersonaMode(value: unknown): value is PersonaMode {
  return value === "neutral" || value === "gentleman";
}

function readBundledHotmilkTemplate(): HotmilkConfig {
  return JSON.parse(readFileSync(BUNDLED_TEMPLATE_PATH, "utf8")) as HotmilkConfig;
}

function isProjectTrustMode(value: unknown): value is ProjectTrustMode {
  return value === "delegate" || value === "prompt" || value === "always" || value === "never";
}

function buildDefaultConfigFromTemplate(template: HotmilkConfig): {
  extensions: Record<BundledExtensionId, boolean>;
  graph: ResolvedGraphSettings;
  defaults: ResolvedDefaults;
  mcp: ResolvedMcpSettings;
  projectTrust: ResolvedProjectTrust;
} {
  const extensions = {} as Record<BundledExtensionId, boolean>;
  for (const id of BUNDLED_EXTENSION_IDS) {
    const value = template.extensions?.[id];
    if (typeof value !== "boolean") {
      throw new Error(`hotmilk.json template missing extensions.${id}`);
    }
    extensions[id] = value;
  }

  const language = template.defaults?.language?.trim();
  const persona = template.defaults?.persona;
  const projectTrustMode = template.projectTrust?.mode;

  return {
    extensions,
    graph: {
      warnOnStale: template.graph?.warnOnStale ?? true,
      autoSuggestUpdate: template.graph?.autoSuggestUpdate ?? true,
    },
    defaults: {
      ...(language ? { language } : {}),
      persona: isPersonaMode(persona) ? persona : "gentleman",
    },
    mcp: {
      seedOnStart: template.mcp?.seedOnStart ?? false,
    },
    projectTrust: {
      mode: isProjectTrustMode(projectTrustMode) ? projectTrustMode : "delegate",
      remember: template.projectTrust?.remember ?? false,
    },
  };
}

/** Filename used for hotmilk config under the config root. */
export const CONFIG_FILENAME = "hotmilk.json";
/** Human-readable label for the agent-level config path. */
export const AGENT_HOTMILK_CONFIG_LABEL = "~/.pi/agent/hotmilk.json";

export { BUNDLED_EXTENSION_IDS, type BundledExtensionId } from "./bundled-extensions.ts";

/** Supported persona modes. */
export type PersonaMode = "gentleman" | "neutral";

/** Supported project-trust decision modes. */
export type ProjectTrustMode = "delegate" | "prompt" | "always" | "never";

/** Resolved project-trust settings. */
export type ResolvedProjectTrust = {
  mode: ProjectTrustMode;
  remember: boolean;
};

/** User-editable hotmilk config schema. */
export type HotmilkConfig = {
  extensions?: Partial<Record<BundledExtensionId, boolean>>;
  graph?: {
    warnOnStale?: boolean;
    autoSuggestUpdate?: boolean;
  };
  defaults?: {
    language?: string;
    persona?: PersonaMode;
  };
  mcp?: {
    seedOnStart?: boolean;
  };
  projectTrust?: {
    mode?: ProjectTrustMode;
    remember?: boolean;
  };
};

type ConfigPathResult = {
  path: string;
  error?: string;
};

type LoadedHotmilkConfig = ConfigPathResult & {
  config: HotmilkConfig;
};

type SeedHotmilkConfigResult = ConfigPathResult & {
  seeded: boolean;
};

/** Resolved graphify-related settings. */
export type ResolvedGraphSettings = {
  warnOnStale: boolean;
  autoSuggestUpdate: boolean;
};

/** Resolved default persona/language settings. */
export type ResolvedDefaults = {
  language?: string;
  persona: PersonaMode;
};

/** Resolved MCP bootstrap settings. */
export type ResolvedMcpSettings = {
  seedOnStart: boolean;
};

/**
 * In-memory default config derived from the bundled `hotmilk.json` template.
 *
 * This is the single source of truth for bundled defaults.
 */
export const DEFAULT_HOTMILK_CONFIG = buildDefaultConfigFromTemplate(readBundledHotmilkTemplate());

/**
 * Resolve the directory that holds `hotmilk.json`.
 *
 * @param configRoot - explicit override
 * @returns config root directory
 */
export function resolveHotmilkConfigRoot(configRoot?: string): string {
  if (configRoot) {
    return configRoot;
  }
  if (process.env.HOTMILK_CONFIG_ROOT) {
    return process.env.HOTMILK_CONFIG_ROOT;
  }
  return join(homedir(), ".pi", "agent");
}

/**
 * Resolve the full path to `hotmilk.json`.
 *
 * @param configRoot - explicit config root override
 */
export function getHotmilkConfigPath(configRoot?: string): string {
  return join(resolveHotmilkConfigRoot(configRoot), CONFIG_FILENAME);
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function ensureConfigDir(configPath: string): void {
  mkdirSync(join(configPath, ".."), { recursive: true });
}

function writeHotmilkConfigFile(path: string, config: HotmilkConfig): void {
  ensureConfigDir(path);
  writeFileSync(path, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

/**
 * Copy the bundled `hotmilk.json` template to the agent config directory.
 *
 * @param configRoot - explicit config root override
 * @returns seed result, with `error` set on filesystem failure
 */
export function seedHotmilkConfigIfMissing(configRoot?: string): SeedHotmilkConfigResult {
  const configPath = getHotmilkConfigPath(configRoot);
  if (existsSync(configPath)) {
    return { seeded: false, path: configPath };
  }
  ensureConfigDir(configPath);
  copyFileSync(BUNDLED_TEMPLATE_PATH, configPath);
  return { seeded: true, path: configPath };
}

/**
 * Load hotmilk config from disk, falling back to {@link DEFAULT_HOTMILK_CONFIG}.
 *
 * @param configRoot - explicit config root override
 */
export function loadHotmilkConfig(configRoot?: string): LoadedHotmilkConfig {
  const configPath = getHotmilkConfigPath(configRoot);
  if (!existsSync(configPath)) {
    return { path: configPath, config: DEFAULT_HOTMILK_CONFIG };
  }

  try {
    const parsed = JSON.parse(readFileSync(configPath, "utf8")) as HotmilkConfig;
    return { path: configPath, config: parsed };
  } catch (error) {
    return { path: configPath, config: DEFAULT_HOTMILK_CONFIG, error: formatError(error) };
  }
}

/**
 * Persist hotmilk config to disk.
 *
 * @param config - config object to write
 * @param configRoot - explicit config root override
 */
export function saveHotmilkConfig(config: HotmilkConfig, configRoot?: string): ConfigPathResult {
  const configPath = getHotmilkConfigPath(configRoot);
  try {
    writeHotmilkConfigFile(configPath, config);
    return { path: configPath };
  } catch (error) {
    return { path: configPath, error: formatError(error) };
  }
}

/**
 * Load and resolve bundled-extension toggle state.
 *
 * @param configRoot - explicit config root override
 */
export function loadBundledExtensionToggles(
  configRoot?: string,
): Record<BundledExtensionId, boolean> {
  return resolveBundledExtensionToggles(loadHotmilkConfig(configRoot).config);
}

export {
  resolveBundledExtensionToggles,
  resolveDefaults,
  resolveGraphSettings,
  resolveMcpSettings,
  resolveProjectTrust,
} from "./resolve.ts";
