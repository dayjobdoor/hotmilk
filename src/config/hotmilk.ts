/**
 * hotmilk user configuration loading and defaults.
 *
 * Reads/writes `hotmilk.json` under Pi's agent dir (`PI_CODING_AGENT_DIR` or
 * `~/.pi/agent`) and derives in-memory defaults from the bundled template.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getAgentDir } from "@earendil-works/pi-coding-agent";
import {
  formatCaughtError,
  isJsonBoolean,
  isJsonObject,
  isJsonString,
  parseJsonValue,
  type JsonValue,
} from "../bootstrap/json.ts";
import {
  BUNDLED_EXTENSION_DEFINITIONS,
  BUNDLED_EXTENSION_IDS,
  type ExtensionToggleMap,
} from "./bundled-extensions.ts";

const PACKAGE_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const BUNDLED_TEMPLATE_PATH = join(PACKAGE_ROOT, "hotmilk.json");

/** Supported persona modes. */
export const PERSONA_MODES = ["gentleman", "neutral", "gyal", "raiden"] as const;

export type PersonaMode = (typeof PERSONA_MODES)[number];

/** Type guard for {@link PersonaMode}. */
export function isPersonaMode(value: string | undefined): value is PersonaMode {
  return PERSONA_MODES.some((mode) => mode === value);
}

export function isProjectTrustMode(
  value: JsonValue | string | undefined,
): value is ProjectTrustMode {
  return value === "delegate" || value === "prompt" || value === "always" || value === "never";
}

function parseHotmilkConfig(value: JsonValue): HotmilkConfig {
  if (!isJsonObject(value)) {
    return {};
  }
  const config: HotmilkConfig = {};
  if (isJsonObject(value.extensions)) {
    const extensions: Partial<ExtensionToggleMap> = {};
    for (const id of BUNDLED_EXTENSION_IDS) {
      const flag = value.extensions[id];
      if (isJsonBoolean(flag)) {
        extensions[id] = flag;
      }
    }
    config.extensions = extensions;
  }
  if (isJsonObject(value.graph)) {
    config.graph = {};
    if (isJsonBoolean(value.graph.warnOnStale)) {
      config.graph.warnOnStale = value.graph.warnOnStale;
    }
    if (isJsonBoolean(value.graph.autoSuggestUpdate)) {
      config.graph.autoSuggestUpdate = value.graph.autoSuggestUpdate;
    }
  }
  if (isJsonObject(value.defaults)) {
    config.defaults = {};
    if (isJsonString(value.defaults.language)) {
      config.defaults.language = value.defaults.language;
    }
    if (isJsonString(value.defaults.persona) && isPersonaMode(value.defaults.persona)) {
      config.defaults.persona = value.defaults.persona;
    }
  }
  if (isJsonObject(value.projectTrust)) {
    config.projectTrust = {};
    if (isProjectTrustMode(value.projectTrust.mode)) {
      config.projectTrust.mode = value.projectTrust.mode;
    }
    if (isJsonBoolean(value.projectTrust.remember)) {
      config.projectTrust.remember = value.projectTrust.remember;
    }
  }
  return config;
}

function readBundledHotmilkTemplate(): HotmilkConfig {
  return parseHotmilkConfig(parseJsonValue(readFileSync(BUNDLED_TEMPLATE_PATH, "utf8")));
}

type DefaultHotmilkConfig = {
  extensions: ExtensionToggleMap;
  graph: ResolvedGraphSettings;
  defaults: ResolvedDefaults;
  projectTrust: ResolvedProjectTrust;
};

function buildDefaultConfigFromTemplate(template: HotmilkConfig): DefaultHotmilkConfig {
  const extensions = Object.fromEntries(
    BUNDLED_EXTENSION_DEFINITIONS.map((definition) => [
      definition.id,
      "defaultEnabled" in definition && definition.defaultEnabled === true,
    ]),
  );
  // SAFETY: registry ids are unique and cover every BundledExtensionId.
  const typedExtensions = extensions as ExtensionToggleMap;
  const language = template.defaults?.language?.trim();

  const persona = template.defaults?.persona;
  const defaults: ResolvedDefaults = {
    persona: isPersonaMode(persona) ? persona : "neutral",
  };
  if (language) {
    defaults.language = language;
  }

  return {
    extensions: typedExtensions,
    graph: {
      warnOnStale: template.graph?.warnOnStale ?? true,
      autoSuggestUpdate: template.graph?.autoSuggestUpdate ?? true,
    },
    defaults,
    projectTrust: {
      mode: isProjectTrustMode(template.projectTrust?.mode)
        ? template.projectTrust.mode
        : "delegate",
      remember: template.projectTrust?.remember === true,
    },
  };
}

/** Filename used for hotmilk config under the config root. */
export const CONFIG_FILENAME = "hotmilk.json";
/** Human-readable label for the agent-level config path. */
export const AGENT_HOTMILK_CONFIG_LABEL = "~/.pi/agent/hotmilk.json";

export { BUNDLED_EXTENSION_IDS, type BundledExtensionId } from "./bundled-extensions.ts";

export type ProjectTrustMode = "delegate" | "prompt" | "always" | "never";

/** Resolved project-trust settings. */
export type ResolvedProjectTrust = {
  mode: ProjectTrustMode;
  remember: boolean;
};

/** User-editable hotmilk config schema. */
export type HotmilkConfig = {
  extensions?: Partial<ExtensionToggleMap>;
  graph?: {
    warnOnStale?: boolean;
    autoSuggestUpdate?: boolean;
  };
  defaults?: {
    language?: string;
    persona?: PersonaMode;
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

/**
 * In-memory default config derived from the bundled template and extension registry.
 *
 * This is the single source of truth for bundled defaults.
 */
export const DEFAULT_HOTMILK_CONFIG = buildDefaultConfigFromTemplate(readBundledHotmilkTemplate());

/**
 * Resolve the directory that holds `hotmilk.json`.
 *
 * Precedence: explicit `configRoot`, then `HOTMILK_CONFIG_ROOT` (tests/sandboxes),
 * then Pi's agent dir (`PI_CODING_AGENT_DIR` via {@link getAgentDir}).
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
  return getAgentDir();
}

/**
 * Path shown in `/mode` and seed notifications.
 *
 * Uses the conventional `~/.pi/agent/hotmilk.json` label when that is the
 * resolved path; otherwise the absolute path (for `PI_CODING_AGENT_DIR`).
 *
 * @param configRoot - explicit config root override
 */
export function hotmilkConfigDisplayPath(configRoot?: string): string {
  const configPath = getHotmilkConfigPath(configRoot);
  if (configPath === join(homedir(), ".pi", "agent", CONFIG_FILENAME)) {
    return AGENT_HOTMILK_CONFIG_LABEL;
  }
  return configPath;
}

/**
 * Resolve the full path to `hotmilk.json`.
 *
 * @param configRoot - explicit config root override
 */
export function getHotmilkConfigPath(configRoot?: string): string {
  return join(resolveHotmilkConfigRoot(configRoot), CONFIG_FILENAME);
}

function ensureConfigDir(configPath: string): void {
  mkdirSync(join(configPath, ".."), { recursive: true });
}

function writeHotmilkConfigFile(path: string, config: HotmilkConfig): void {
  ensureConfigDir(path);
  writeFileSync(path, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

/**
 * Write the resolved defaults to the agent config directory when missing.
 *
 * @param configRoot - explicit config root override
 * @returns seed result
 */
export function seedHotmilkConfigIfMissing(configRoot?: string): SeedHotmilkConfigResult {
  const configPath = getHotmilkConfigPath(configRoot);
  if (existsSync(configPath)) {
    return { seeded: false, path: configPath };
  }
  writeHotmilkConfigFile(configPath, DEFAULT_HOTMILK_CONFIG);
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
    const parsed = parseHotmilkConfig(parseJsonValue(readFileSync(configPath, "utf8")));
    return { path: configPath, config: parsed };
  } catch (error) {
    return { path: configPath, config: DEFAULT_HOTMILK_CONFIG, error: formatCaughtError(error) };
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
    return { path: configPath, error: formatCaughtError(error) };
  }
}

export type { ExtensionToggleMap } from "./bundled-extensions.ts";
