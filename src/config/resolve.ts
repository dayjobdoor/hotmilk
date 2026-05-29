import {
  BUNDLED_EXTENSION_IDS,
  DEFAULT_HOTMILK_CONFIG,
  type BundledExtensionId,
  type HotmilkConfig,
  type PersonaMode,
  type ResolvedDefaults,
  type ResolvedGraphSettings,
  type ResolvedMcpSettings,
} from "./hotmilk.ts";

function isPersonaMode(value: unknown): value is PersonaMode {
  return value === "neutral" || value === "gentleman";
}

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

export function resolveGraphSettings(config: HotmilkConfig): ResolvedGraphSettings {
  return {
    warnOnStale: config.graph?.warnOnStale ?? DEFAULT_HOTMILK_CONFIG.graph.warnOnStale,
    autoSuggestUpdate:
      config.graph?.autoSuggestUpdate ?? DEFAULT_HOTMILK_CONFIG.graph.autoSuggestUpdate,
  };
}

export function resolveDefaults(config: HotmilkConfig): ResolvedDefaults {
  const language = config.defaults?.language?.trim();
  const persona = config.defaults?.persona;
  return {
    ...(language ? { language } : {}),
    persona: isPersonaMode(persona) ? persona : DEFAULT_HOTMILK_CONFIG.defaults.persona,
  };
}

export function resolveMcpSettings(config: HotmilkConfig): ResolvedMcpSettings {
  return {
    seedOnStart: config.mcp?.seedOnStart ?? DEFAULT_HOTMILK_CONFIG.mcp.seedOnStart,
  };
}
