import {
  BUNDLED_EXTENSION_IDS,
  DEFAULT_HOTMILK_CONFIG,
  type BundledExtensionId,
  type HotmilkConfig,
  type PersonaMode,
  type ProjectTrustMode,
  type ResolvedDefaults,
  type ResolvedGraphSettings,
  type ResolvedMcpSettings,
  type ResolvedProjectTrust,
} from "./hotmilk.ts";

function isPersonaMode(value: unknown): value is PersonaMode {
  return value === "neutral" || value === "gentleman";
}

/** Resolve final bundled-extension toggles by overlaying user config on bundled defaults. */
export function resolveBundledExtensionToggles(
  config: HotmilkConfig,
): Record<BundledExtensionId, boolean> {
  return Object.fromEntries(
    BUNDLED_EXTENSION_IDS.map((id) => [
      id,
      config.extensions?.[id] ?? DEFAULT_HOTMILK_CONFIG.extensions[id],
    ]),
  ) as Record<BundledExtensionId, boolean>;
}

/** Resolve graphify settings from user config with bundled defaults fallback. */
export function resolveGraphSettings(config: HotmilkConfig): ResolvedGraphSettings {
  return {
    warnOnStale: config.graph?.warnOnStale ?? DEFAULT_HOTMILK_CONFIG.graph.warnOnStale,
    autoSuggestUpdate:
      config.graph?.autoSuggestUpdate ?? DEFAULT_HOTMILK_CONFIG.graph.autoSuggestUpdate,
  };
}

/** Resolve default runtime settings (language, persona) from user config. */
export function resolveDefaults(config: HotmilkConfig): ResolvedDefaults {
  const language = config.defaults?.language?.trim();
  const persona = config.defaults?.persona;
  return {
    ...(language ? { language } : {}),
    persona: isPersonaMode(persona) ? persona : DEFAULT_HOTMILK_CONFIG.defaults.persona,
  };
}

/** Resolve MCP settings from user config with bundled defaults fallback. */
export function resolveMcpSettings(config: HotmilkConfig): ResolvedMcpSettings {
  return {
    seedOnStart: config.mcp?.seedOnStart ?? DEFAULT_HOTMILK_CONFIG.mcp.seedOnStart,
  };
}

function isProjectTrustMode(value: unknown): value is ProjectTrustMode {
  return value === "delegate" || value === "prompt" || value === "always" || value === "never";
}

/** Resolve project-trust settings from user config with bundled defaults fallback. */
export function resolveProjectTrust(config: HotmilkConfig): ResolvedProjectTrust {
  const mode = config.projectTrust?.mode;
  const remember = config.projectTrust?.remember;
  return {
    mode: isProjectTrustMode(mode) ? mode : DEFAULT_HOTMILK_CONFIG.projectTrust.mode,
    remember:
      typeof remember === "boolean" ? remember : DEFAULT_HOTMILK_CONFIG.projectTrust.remember,
  };
}
