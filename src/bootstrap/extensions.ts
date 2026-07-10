import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import {
  BUNDLED_EXTENSION_DEFINITIONS,
  CONTEXT_STACK_EXTENSION_IDS,
} from "../config/bundled-extensions.ts";
import {
  detectGlobalBundledExtensionSkips,
  type GlobalBundledExtensionSkip,
} from "./global-extension-sources.ts";
import { bundledImportUrl } from "./resolve-bundled.ts";
import { BUNDLED_EXTENSION_IDS, type BundledExtensionId } from "../config/hotmilk.ts";

type ExtensionFactory = (pi: ExtensionAPI) => void | Promise<void>;

/** Bundled deps may type against @mariozechner/pi-coding-agent; hotmilk uses @earendil-works. */
type ExtensionModule = { default: unknown };

function loadBundled(relativePath: string): () => Promise<ExtensionModule> {
  return () => import(bundledImportUrl(relativePath));
}

/** Derived from {@link BUNDLED_EXTENSION_DEFINITIONS} — one loader per manifest row. */
const BUNDLED_EXTENSION_LOADERS = Object.fromEntries(
  BUNDLED_EXTENSION_DEFINITIONS.map((definition) => [
    definition.id,
    loadBundled(definition.module),
  ]),
) as Record<BundledExtensionId, () => Promise<ExtensionModule>>;

async function registerOne(pi: ExtensionAPI, id: BundledExtensionId): Promise<void> {
  const mod = await BUNDLED_EXTENSION_LOADERS[id]();
  await (mod.default as ExtensionFactory)(pi);
}

/** Options controlling how bundled extensions are registered. */
export type RegisterBundledExtensionsOptions = {
  cwd?: string;
  /** Precomputed skips (tests); defaults to scanning Pi settings. */
  globalSkips?: GlobalBundledExtensionSkip[];
  /** When false, only global Pi settings are scanned (trust-safe startup). */
  includeProjectSettings?: boolean;
};

/** Result of bundled-extension registration, including skipped ids. */
export type RegisterBundledExtensionsResult = {
  globalSkips: GlobalBundledExtensionSkip[];
};

/** Register all enabled bundled extensions with the Pi extension API. */
export async function registerBundledExtensions(
  pi: ExtensionAPI,
  enabled: Record<BundledExtensionId, boolean>,
  options: RegisterBundledExtensionsOptions = {},
): Promise<RegisterBundledExtensionsResult> {
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

  for (const id of CONTEXT_STACK_EXTENSION_IDS) {
    if (enabledIds.has(id)) {
      await registerOne(pi, id);
      enabledIds.delete(id);
    }
  }

  if (enabledIds.has("agent-dashboard")) {
    enabledIds.delete("agent-dashboard");
    const { ensureDashboardWarmStarted, logHotmilkDashboardDoctorHint } =
      await import("./dashboard.ts");
    const warmStart = await ensureDashboardWarmStarted();
    if (warmStart.status === "failed" || warmStart.status === "skipped-conflict") {
      const detail = warmStart.message ?? `port ${warmStart.port}`;
      console.warn(`[hotmilk] Dashboard warm-start ${warmStart.status}: ${detail}`);
    } else {
      logHotmilkDashboardDoctorHint(warmStart);
    }
    await registerOne(pi, "agent-dashboard");
  }

  if (enabledIds.has("btw")) {
    const { setHotmilkBtwConfig } = await import("./btw.ts");
    setHotmilkBtwConfig({ extensionToggles: enabled });
    await registerOne(pi, "btw");
    enabledIds.delete("btw");
  }

  await Promise.all([...enabledIds].map((id) => registerOne(pi, id)));

  return { globalSkips: appliedSkips };
}
