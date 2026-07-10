import type { GlobalBundledExtensionSkip } from "../bootstrap/global-extension-sources.ts";
import {
  loadHotmilkConfig,
  type BundledExtensionId,
  type HotmilkConfig,
  type ResolvedDefaults,
  type ResolvedGraphSettings,
  type ResolvedMcpSettings,
  type ResolvedProjectTrust,
} from "./hotmilk.ts";
import {
  resolveBundledExtensionToggles,
  resolveDefaults,
  resolveGraphSettings,
  resolveMcpSettings,
  resolveProjectTrust,
} from "./resolve.ts";

/** Aggregated hotmilk configuration and resolved runtime settings. */
export type HotmilkRuntime = {
  config: HotmilkConfig;
  configPath: string;
  configError?: string;
  extensionToggles: Record<BundledExtensionId, boolean>;
  /** Bundled ids skipped because the same npm package is in Pi settings. */
  globalExtensionSkips: GlobalBundledExtensionSkip[];
  defaults: ResolvedDefaults;
  graph: ResolvedGraphSettings;
  mcp: ResolvedMcpSettings;
  projectTrust: ResolvedProjectTrust;
};

/** Load hotmilk config and resolve all runtime settings into a single object. */
export function createHotmilkRuntime(configRoot?: string): HotmilkRuntime {
  const loaded = loadHotmilkConfig(configRoot);
  return {
    config: loaded.config,
    configPath: loaded.path,
    configError: loaded.error,
    extensionToggles: resolveBundledExtensionToggles(loaded.config),
    globalExtensionSkips: [],
    defaults: resolveDefaults(loaded.config),
    graph: resolveGraphSettings(loaded.config),
    mcp: resolveMcpSettings(loaded.config),
    projectTrust: resolveProjectTrust(loaded.config),
  };
}
