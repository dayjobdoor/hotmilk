import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import {
  BUNDLED_EXTENSION_DEFINITIONS,
  CONTEXT_STACK_EXTENSION_IDS,
} from "../config/bundled-extensions.ts";
import {
  detectGlobalBundledExtensionSkips,
  type GlobalBundledExtensionSkip,
} from "./global-extension-sources.ts";
import type { ExtensionModule } from "./extension-module.ts";
import { bundledImportUrl } from "./resolve-bundled.ts";
import { BUNDLED_EXTENSION_IDS, type BundledExtensionId } from "../config/bundled-extensions.ts";
import { formatCaughtError } from "./json.ts";
import type { Harness } from "../config/runtime.ts";

function loadBundled(relativePath: string): () => Promise<ExtensionModule> {
  return () => import(bundledImportUrl(relativePath));
}

/** Derived from {@link BUNDLED_EXTENSION_DEFINITIONS} — one loader per manifest row. */
// SAFETY: every BundledExtensionId is present because we map BUNDLED_EXTENSION_DEFINITIONS.
const BUNDLED_EXTENSION_LOADERS = Object.fromEntries(
  BUNDLED_EXTENSION_DEFINITIONS.map((definition) => [
    definition.id,
    loadBundled(definition.module),
  ]),
) as Record<BundledExtensionId, () => Promise<ExtensionModule>>;

/** A bundled row that failed to import or register; reported at session start, never thrown. */
export type BundledExtensionFailure = { id: BundledExtensionId; message: string };

/**
 * Shortcuts a bundled row must not register, per row. Pi keeps keys it owns: pi-btw's
 * Alt+W (overlay width) would otherwise shadow the editor's word-right (`tui.editor.cursorWordRight`),
 * and Pi lets the extension win silently even while no overlay is open.
 */
const DROPPED_SHORTCUTS = new Map<BundledExtensionId, readonly string[]>([["btw", ["alt+w"]]]);

/**
 * `pi` minus the given shortcut registrations; everything else delegates to the real API
 * (Pi builds it as an object of closures, so a prototype link keeps every member working).
 */
function withoutShortcuts(pi: ExtensionAPI, dropped: readonly string[]): ExtensionAPI {
  const registerShortcut: ExtensionAPI["registerShortcut"] = (...args) =>
    dropped.includes(args[0].toLowerCase()) ? undefined : pi.registerShortcut(...args);
  return Object.assign(Object.create(pi), { registerShortcut });
}

/** One broken row must not discard hotmilk (Pi drops everything an extension registered when its factory throws). */
async function registerOne(
  pi: ExtensionAPI,
  id: BundledExtensionId,
  harness: Harness,
): Promise<BundledExtensionFailure | undefined> {
  // Literal import: omp's module-graph analyzer must see this edge (see omp-loaders.js).
  const ompLoader =
    harness === "omp" ? (await import("./omp-loaders.js")).OMP_BUNDLED_LOADERS[id] : undefined;
  const load = ompLoader ?? BUNDLED_EXTENSION_LOADERS[id];
  try {
    const mod = await load();
    const factory = mod.default;
    if (factory instanceof Function) {
      const dropped = DROPPED_SHORTCUTS.get(id);
      await factory(dropped ? withoutShortcuts(pi, dropped) : pi);
    }
    return undefined;
  } catch (cause) {
    return { id, message: formatCaughtError(cause) };
  }
}

/** Options controlling how bundled extensions are registered. */
type RegisterBundledExtensionsOptions = {
  /** Precomputed skips (tests); defaults to scanning global Pi settings. */
  globalSkips?: GlobalBundledExtensionSkip[];
  /** Host harness; omp loads rows through literal specifiers. Defaults to `pi`. */
  harness?: Harness;
};

/**
 * Register all enabled bundled extensions with the Pi extension API.
 * Dedupe scans global Pi settings only: this runs before project trust.
 */
export async function registerBundledExtensions(
  pi: ExtensionAPI,
  enabled: Record<BundledExtensionId, boolean>,
  options: RegisterBundledExtensionsOptions = {},
): Promise<{
  globalSkips: GlobalBundledExtensionSkip[];
  failures: BundledExtensionFailure[];
}> {
  const globalSkips =
    options.globalSkips ?? detectGlobalBundledExtensionSkips({ includeProjectSettings: false });
  const skipById = new Map(globalSkips.map((skip) => [skip.id, skip] as const));
  const harness = options.harness ?? "pi";

  const enabledIds = new Set<BundledExtensionId>();
  const appliedSkips: GlobalBundledExtensionSkip[] = [];
  for (const id of BUNDLED_EXTENSION_IDS) {
    if (!enabled[id]) continue;
    const skip = skipById.get(id);
    if (skip) {
      appliedSkips.push(skip);
      continue;
    }
    enabledIds.add(id);
  }

  const results: (BundledExtensionFailure | undefined)[] = [];
  for (const id of CONTEXT_STACK_EXTENSION_IDS) {
    if (enabledIds.has(id)) {
      results.push(await registerOne(pi, id, harness));
      enabledIds.delete(id);
    }
  }

  results.push(...(await Promise.all([...enabledIds].map((id) => registerOne(pi, id, harness)))));

  return {
    globalSkips: appliedSkips,
    failures: results.filter((result) => result !== undefined),
  };
}
