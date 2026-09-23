import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

/** No-op stand-in for heavy bundled modules in startup wiring tests. */
export default async function registerNoopBundle(_pi: ExtensionAPI): Promise<void> {}
