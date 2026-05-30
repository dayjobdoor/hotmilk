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

function buildDefaultConfigFromTemplate(template: HotmilkConfig): {
  extensions: Record<BundledExtensionId, boolean>;
  graph: ResolvedGraphSettings;
  defaults: ResolvedDefaults;
  mcp: ResolvedMcpSettings;
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
  };
}

export const CONFIG_FILENAME = "hotmilk.json";
export const AGENT_HOTMILK_CONFIG_LABEL = "~/.pi/agent/hotmilk.json";

export { BUNDLED_EXTENSION_IDS, type BundledExtensionId } from "./bundled-extensions.ts";

export type PersonaMode = "gentleman" | "neutral";

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

export type ResolvedGraphSettings = {
  warnOnStale: boolean;
  autoSuggestUpdate: boolean;
};

export type ResolvedDefaults = {
  language?: string;
  persona: PersonaMode;
};

export type ResolvedMcpSettings = {
  seedOnStart: boolean;
};

/** Derived from the bundled `hotmilk.json` template (single source of truth). */
export const DEFAULT_HOTMILK_CONFIG = buildDefaultConfigFromTemplate(readBundledHotmilkTemplate());

export function resolveHotmilkConfigRoot(configRoot?: string): string {
  if (configRoot) {
    return configRoot;
  }
  if (process.env.HOTMILK_CONFIG_ROOT) {
    return process.env.HOTMILK_CONFIG_ROOT;
  }
  return join(homedir(), ".pi", "agent");
}

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

export function seedHotmilkConfigIfMissing(configRoot?: string): SeedHotmilkConfigResult {
  const configPath = getHotmilkConfigPath(configRoot);
  if (existsSync(configPath)) {
    return { seeded: false, path: configPath };
  }
  ensureConfigDir(configPath);
  copyFileSync(BUNDLED_TEMPLATE_PATH, configPath);
  return { seeded: true, path: configPath };
}

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

export function saveHotmilkConfig(config: HotmilkConfig, configRoot?: string): ConfigPathResult {
  const configPath = getHotmilkConfigPath(configRoot);
  try {
    writeHotmilkConfigFile(configPath, config);
    return { path: configPath };
  } catch (error) {
    return { path: configPath, error: formatError(error) };
  }
}

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
} from "./resolve.ts";
