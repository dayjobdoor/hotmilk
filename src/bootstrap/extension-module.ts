import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

/** Bundled deps may type against @mariozechner/pi-coding-agent; hotmilk uses @earendil-works. */
export type ExtensionModule = { default: (pi: ExtensionAPI) => void | Promise<void> };
