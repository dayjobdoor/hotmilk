import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

type ExtensionEventHandler = Parameters<ExtensionAPI["on"]>[1];

export type ExtensionContext = Parameters<ExtensionEventHandler>[1];
