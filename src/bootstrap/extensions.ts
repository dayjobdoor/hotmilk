import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { CONTEXT_STACK_EXTENSION_IDS } from "./context-stack.ts";
import { BUNDLED_EXTENSION_IDS, type BundledExtensionId } from "../config/hotmilk.ts";

type ExtensionFactory = (pi: ExtensionAPI) => void | Promise<void>;

/** Bundled deps may type against @mariozechner/pi-coding-agent; hotmilk uses @earendil-works. */
type ExtensionModule = { default: unknown };

/**
 * Load bundled extensions on demand so disabled toggles do not pay import cost.
 * Context stack registers sequentially; other enabled extensions load in parallel.
 */
const BUNDLED_EXTENSION_LOADERS: Record<BundledExtensionId, () => Promise<ExtensionModule>> = {
  "skill-registry": () => import("../../node_modules/gentle-pi/extensions/skill-registry.ts"),
  "sdd-init": () => import("../../node_modules/gentle-pi/extensions/sdd-init.ts"),
  "gentle-ai": () => import("../../node_modules/gentle-pi/extensions/gentle-ai.ts"),
  // Same entry as upstream .pi/extensions/context-mode → build/adapters/pi/extension.js
  "context-mode": () => import("../../node_modules/context-mode/build/adapters/pi/extension.js"),
  "ask-user": () => import("pi-ask-user"),
  graphify: () => import("../../node_modules/graphify-pi/extensions/graphify.ts"),
  subagents: () => import("../../node_modules/pi-subagents/src/extension/index.ts"),
  goal: () => import("../../node_modules/pi-goal/.pi/extensions/pi-goal/index.ts"),
  docparser: () => import("../../node_modules/pi-docparser/extensions/docparser/index.ts"),
  obsidian: () => import("../../node_modules/@haispeed/pi-obsidian/extensions/obsidian-cli.ts"),
  "cursor-provider": () => import("../../node_modules/@netandreus/pi-cursor-provider/index.ts"),
  btw: () => import("../../node_modules/pi-btw/extensions/btw.ts"),
  simplify: () => import("../../node_modules/pi-simplify/dist/index.js"),
  "rtk-optimizer": () => import("../../node_modules/pi-rtk-optimizer/index.ts"),
  "mcp-adapter": () => import("../../node_modules/pi-mcp-adapter/index.ts"),
  "planning-with-files": () =>
    import("../../node_modules/@tomxprime/planning-with-files/extensions/planning-with-files/index.ts"),
  caveman: () => import("../../node_modules/pi-caveman/extensions/caveman.ts"),
  "red-green": () => import("../../node_modules/pi-red-green/dist/index.js"),
  "agent-dashboard": () =>
    import("../../node_modules/@blackbelt-technology/pi-agent-dashboard/packages/extension/src/bridge.ts"),
  "web-access": () => import("../../node_modules/pi-web-access/index.ts"),
  "pi-flows": () => import("../../node_modules/@blackbelt-technology/pi-flows/extensions/index.ts"),
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
