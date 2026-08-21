import {
  BUNDLED_EXTENSION_IDS,
  DEFAULT_HOTMILK_CONFIG,
  type ExtensionToggleMap,
  type HotmilkConfig,
  isPersonaMode,
  type ProjectTrustMode,
  type ResolvedDefaults,
  type ResolvedGraphSettings,
  type ResolvedMcpSettings,
  type ResolvedProjectTrust,
} from "./hotmilk.ts";

/** Resolve final bundled-extension toggles by overlaying user config on bundled defaults. */
export function resolveBundledExtensionToggles(config: HotmilkConfig): ExtensionToggleMap {
  const toggles: Partial<ExtensionToggleMap> = {};
  for (const id of BUNDLED_EXTENSION_IDS) {
    toggles[id] = config.extensions?.[id] ?? DEFAULT_HOTMILK_CONFIG.extensions[id];
  }
  // SAFETY: every BundledExtensionId is assigned from BUNDLED_EXTENSION_IDS above.
  return toggles as ExtensionToggleMap;
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
  const defaults: ResolvedDefaults = {
    persona: isPersonaMode(persona) ? persona : DEFAULT_HOTMILK_CONFIG.defaults.persona,
  };
  if (language) {
    defaults.language = language;
  }
  return defaults;
}

/** Resolve MCP settings from user config with bundled defaults fallback. */
export function resolveMcpSettings(config: HotmilkConfig): ResolvedMcpSettings {
  return {
    seedOnStart: config.mcp?.seedOnStart ?? DEFAULT_HOTMILK_CONFIG.mcp.seedOnStart,
  };
}

function isProjectTrustMode(value: string | undefined): value is ProjectTrustMode {
  return value === "delegate" || value === "prompt" || value === "always" || value === "never";
}

/** Resolve project-trust settings from user config with bundled defaults fallback. */
export function resolveProjectTrust(config: HotmilkConfig): ResolvedProjectTrust {
  const mode = config.projectTrust?.mode;
  const remember = config.projectTrust?.remember;
  return {
    mode: isProjectTrustMode(mode) ? mode : DEFAULT_HOTMILK_CONFIG.projectTrust.mode,
    remember:
      remember === true || remember === false
        ? remember
        : DEFAULT_HOTMILK_CONFIG.projectTrust.remember,
  };
}
