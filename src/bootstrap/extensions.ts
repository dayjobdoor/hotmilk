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

async function registerOne(pi: ExtensionAPI, id: BundledExtensionId): Promise<void> {
  const load = BUNDLED_EXTENSION_LOADERS[id];
  try {
    const mod = await load();
    const factory = mod.default;
    if (factory instanceof Function) {
      await factory(pi);
    }
  } catch (cause) {
    const detail = formatCaughtError(cause);
    const message = `[hotmilk] Failed to load bundled extension "${id}": ${detail}`;
    console.error(message);
    throw new Error(message);
  }
}

/** Options controlling how bundled extensions are registered. */
export type RegisterBundledExtensionsOptions = {
  cwd?: string;
  /** Precomputed skips (tests); defaults to scanning Pi settings. */
  globalSkips?: GlobalBundledExtensionSkip[];
  /** When false, only global Pi settings are scanned (trust-safe startup). */
  includeProjectSettings?: boolean;
};

/** Register all enabled bundled extensions with the Pi extension API. */
export async function registerBundledExtensions(
  pi: ExtensionAPI,
  enabled: Record<BundledExtensionId, boolean>,
  options: RegisterBundledExtensionsOptions = {},
): Promise<{ globalSkips: GlobalBundledExtensionSkip[] }> {
  const globalSkips =
    options.globalSkips ??
    detectGlobalBundledExtensionSkips({
      cwd: options.cwd,
      includeProjectSettings: options.includeProjectSettings ?? true,
    });
  const skipById = new Map(globalSkips.map((skip) => [skip.id, skip] as const));

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

  // Keep BTW internals lazy when its toggle is off; prepare before registry import when on.
  if (enabledIds.has("btw")) {
    const { installHotmilkBtwSessionHook, setHotmilkBtwConfig } = await import("./btw.ts");
    installHotmilkBtwSessionHook();
    setHotmilkBtwConfig({ extensionToggles: enabled });
  }

  for (const id of CONTEXT_STACK_EXTENSION_IDS) {
    if (enabledIds.has(id)) {
      await registerOne(pi, id);
      enabledIds.delete(id);
    }
  }

  await Promise.all([...enabledIds].map((id) => registerOne(pi, id)));

  return { globalSkips: appliedSkips };
}
