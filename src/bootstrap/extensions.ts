import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { CONTEXT_STACK_EXTENSION_IDS } from "./context-stack.ts";
import { bundledImportUrl } from "./resolve-bundled.ts";
import { BUNDLED_EXTENSION_IDS, type BundledExtensionId } from "../config/hotmilk.ts";

type ExtensionFactory = (pi: ExtensionAPI) => void | Promise<void>;

/** Bundled deps may type against @mariozechner/pi-coding-agent; hotmilk uses @earendil-works. */
type ExtensionModule = { default: unknown };

function loadBundled(relativePath: string): () => Promise<ExtensionModule> {
  return () => import(bundledImportUrl(relativePath));
}

/**
 * Load bundled extensions on demand so disabled toggles do not pay import cost.
 * Context stack registers sequentially; other enabled extensions load in parallel.
 */
const BUNDLED_EXTENSION_LOADERS: Record<BundledExtensionId, () => Promise<ExtensionModule>> = {
  "skill-registry": loadBundled("gentle-pi/extensions/skill-registry.ts"),
  "sdd-init": loadBundled("gentle-pi/extensions/sdd-init.ts"),
  "gentle-ai": loadBundled("gentle-pi/extensions/gentle-ai.ts"),
  "context-mode": loadBundled("context-mode/build/adapters/pi/extension.js"),
  "ask-user": loadBundled("pi-ask-user/index.ts"),
  graphify: loadBundled("graphify-pi/extensions/graphify.ts"),
  subagents: loadBundled("pi-subagents/src/extension/index.ts"),
  goal: loadBundled("pi-goal/.pi/extensions/pi-goal/index.ts"),
  docparser: loadBundled("pi-docparser/extensions/docparser/index.ts"),
  obsidian: loadBundled("@haispeed/pi-obsidian/extensions/obsidian-cli.ts"),
  "cursor-provider": loadBundled("@netandreus/pi-cursor-provider/index.ts"),
  btw: loadBundled("pi-btw/extensions/btw.ts"),
  simplify: loadBundled("pi-simplify/dist/index.js"),
  "rtk-optimizer": loadBundled("pi-rtk-optimizer/index.ts"),
  "mcp-adapter": loadBundled("pi-mcp-adapter/index.ts"),
  "planning-with-files": loadBundled(
    "@tomxprime/planning-with-files/extensions/planning-with-files/index.ts",
  ),
  caveman: loadBundled("pi-caveman/extensions/caveman.ts"),
  "red-green": loadBundled("pi-red-green/dist/index.js"),
  "agent-dashboard": loadBundled(
    "@blackbelt-technology/pi-agent-dashboard/packages/extension/src/bridge.ts",
  ),
  "web-access": loadBundled("pi-web-access/index.ts"),
  "pi-flows": loadBundled("@blackbelt-technology/pi-flows/extensions/index.ts"),
};

async function registerOne(pi: ExtensionAPI, id: BundledExtensionId): Promise<void> {
  const mod = await BUNDLED_EXTENSION_LOADERS[id]();
  await (mod.default as ExtensionFactory)(pi);
}

export async function registerBundledExtensions(
  pi: ExtensionAPI,
  enabled: Record<BundledExtensionId, boolean>,
): Promise<void> {
  const enabledIds = new Set(BUNDLED_EXTENSION_IDS.filter((id) => enabled[id]));

  for (const id of CONTEXT_STACK_EXTENSION_IDS) {
    if (enabledIds.has(id)) {
      await registerOne(pi, id);
      enabledIds.delete(id);
    }
  }

  await Promise.all([...enabledIds].map((id) => registerOne(pi, id)));
}
