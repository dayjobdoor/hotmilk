import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

/** Stand-in for pi-btw: registers Alt+W (a Pi built-in) beside its own focus keys. */
export default async function registerShortcuts(pi: ExtensionAPI): Promise<void> {
  pi.registerShortcut("alt+/", { description: "focus", handler: async () => {} });
  pi.registerShortcut("alt+w", { description: "width", handler: async () => {} });
  pi.registerShortcut("ctrl+alt+w", { description: "focus fallback", handler: async () => {} });
}
