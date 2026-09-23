import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

/** Pi extension default export shape used by bundled loaders. */
export type ExtensionFactory = (pi: ExtensionAPI) => void | Promise<void>;

/** Bundled deps may type against @mariozechner/pi-coding-agent; hotmilk uses @earendil-works. */
export type ExtensionModule = { default: ExtensionFactory };
