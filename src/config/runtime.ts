import {
  loadHotmilkConfig,
  type BundledExtensionId,
  type HotmilkConfig,
  type ResolvedDefaults,
  type ResolvedGraphSettings,
  type ResolvedMcpSettings,
} from "./hotmilk.ts";
import {
  resolveBundledExtensionToggles,
  resolveDefaults,
  resolveGraphSettings,
  resolveMcpSettings,
} from "./resolve.ts";

export type HotmilkRuntime = {
  config: HotmilkConfig;
  configPath: string;
  configError?: string;
  extensionToggles: Record<BundledExtensionId, boolean>;
  defaults: ResolvedDefaults;
  graph: ResolvedGraphSettings;
  mcp: ResolvedMcpSettings;
};

export function createHotmilkRuntime(configRoot?: string): HotmilkRuntime {
  const loaded = loadHotmilkConfig(configRoot);
  return {
    config: loaded.config,
    configPath: loaded.path,
    configError: loaded.error,
    extensionToggles: resolveBundledExtensionToggles(loaded.config),
    defaults: resolveDefaults(loaded.config),
    graph: resolveGraphSettings(loaded.config),
    mcp: resolveMcpSettings(loaded.config),
  };
}
