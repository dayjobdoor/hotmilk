import type { GlobalBundledExtensionSkip } from "../bootstrap/global-extension-sources.ts";
import {
  loadHotmilkConfig,
  type BundledExtensionId,
  type ResolvedDefaults,
  type ResolvedGraphSettings,
  type ResolvedProjectTrust,
} from "./hotmilk.ts";
import {
  resolveBundledExtensionToggles,
  resolveDefaults,
  resolveGraphSettings,
  resolveProjectTrust,
} from "./resolve.ts";

/** Aggregated hotmilk configuration and resolved runtime settings. */
export type HotmilkRuntime = {
  configPath: string;
  configError?: string;
  extensionToggles: Record<BundledExtensionId, boolean>;
  /** Bundled ids skipped because the same npm package is in Pi settings. */
  globalExtensionSkips: GlobalBundledExtensionSkip[];
  defaults: ResolvedDefaults;
  graph: ResolvedGraphSettings;
  projectTrust: ResolvedProjectTrust;
};

/** Load hotmilk config and resolve all runtime settings into a single object. */
export function createHotmilkRuntime(configRoot?: string): HotmilkRuntime {
  const loaded = loadHotmilkConfig(configRoot);
  return {
    configPath: loaded.path,
    configError: loaded.error,
    extensionToggles: resolveBundledExtensionToggles(loaded.config),
    globalExtensionSkips: [],
    defaults: resolveDefaults(loaded.config),
    graph: resolveGraphSettings(loaded.config),
    projectTrust: resolveProjectTrust(loaded.config),
  };
}
