import { CONFIG_DIR_NAME, VERSION } from "@earendil-works/pi-coding-agent";
import type { RtkSync } from "../bootstrap/context-stack.ts";
import type { BundledExtensionFailure } from "../bootstrap/extensions.ts";
import type { GlobalBundledExtensionSkip } from "../bootstrap/global-extension-sources.ts";
import {
  BUNDLED_EXTENSION_IDS,
  OMP_SUPPORTED_IDS,
  type BundledExtensionId,
} from "./bundled-extensions.ts";
import {
  legacyDefaultsLost,
  loadHotmilkConfig,
  resolveBundledExtensionToggles,
  resolveDefaults,
  resolveGraphSettings,
  resolveProjectTrust,
  type ResolvedDefaults,
  type ResolvedGraphSettings,
  type ResolvedProjectTrust,
} from "./hotmilk.ts";

/** Host harness running hotmilk. */
export type Harness = "pi" | "omp";

/**
 * Detect the host harness. omp rewrites `@earendil-works/pi-coding-agent`
 * onto its own host module, whose `CONFIG_DIR_NAME` is `.omp` (verified on
 * the audited omp releases; Pi reports `.pi`). Any other config dir (a Pi fork such
 * as `opi`) counts as pi on purpose: forks keep Pi's module system. Env vars are
 * not used: they leak between nested harness processes.
 */
export function detectHarness(): Harness {
  return CONFIG_DIR_NAME === ".omp" ? "omp" : "pi";
}

/** Aggregated hotmilk configuration and resolved runtime settings. */
export type HotmilkRuntime = {
  configPath: string;
  configError?: string;
  harness: Harness;
  /** Host `VERSION` (omp reports its own release through the rewritten import). */
  harnessVersion: string;
  extensionToggles: Record<BundledExtensionId, boolean>;
  /** Enabled bundled ids not loaded because the harness cannot resolve them (omp). */
  harnessSkips: BundledExtensionId[];
  /** Rows that were on by default before 0.2.0 and are now off for lack of a saved value (shown once). */
  legacyDefaultsLost: BundledExtensionId[];
  /** Bundled rows that failed to load (set by the entry); the rest of hotmilk still registers. */
  extensionFailures: BundledExtensionFailure[];
  /** Bundled ids skipped because the same npm package is in Pi settings. */
  globalExtensionSkips: GlobalBundledExtensionSkip[];
  /** pi-rtk-optimizer config sync done before bundles load (set by the entry; absent when rtk is off). */
  rtkSync?: RtkSync;
  defaults: ResolvedDefaults;
  graph: ResolvedGraphSettings;
  projectTrust: ResolvedProjectTrust;
};

/** Load hotmilk config and resolve all runtime settings into a single object. */
export function createHotmilkRuntime(
  configRoot?: string,
  harness: Harness = detectHarness(),
): HotmilkRuntime {
  const loaded = loadHotmilkConfig(configRoot);
  const extensionToggles = resolveBundledExtensionToggles(loaded.config);
  // Under omp only rows flagged `omp: true` load: omp's import rewrite does not
  // reach packages hotmilk imports itself, and one failing row aborts hotmilk.
  // HOTMILK_OMP_UNGATED=1 loads every enabled row anyway, but only inside `bun run audit:omp`
  // (which also sets OMP_AUDIT_TOOLS): a stray inherited variable must not lift the gate.
  const ungated = process.env.HOTMILK_OMP_UNGATED === "1" && process.env.OMP_AUDIT_TOOLS !== undefined;
  const gated = harness === "omp" && !ungated;
  const harnessSkips = gated
    ? BUNDLED_EXTENSION_IDS.filter((id) => extensionToggles[id] && !OMP_SUPPORTED_IDS.includes(id))
    : [];
  for (const id of harnessSkips) extensionToggles[id] = false;
  return {
    configPath: loaded.path,
    configError: loaded.error,
    harness,
    harnessVersion: VERSION,
    extensionToggles,
    harnessSkips,
    legacyDefaultsLost: legacyDefaultsLost(loaded.config),
    extensionFailures: [],
    globalExtensionSkips: [],
    defaults: resolveDefaults(loaded.config),
    graph: resolveGraphSettings(loaded.config),
    projectTrust: resolveProjectTrust(loaded.config),
  };
}
