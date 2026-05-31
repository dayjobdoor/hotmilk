/**
 * hotmilk shim for pi-btw: patches createAgentSession before upstream loads so BTW
 * sub-sessions get lighter prompts, read-biased tools when subagents are on, and
 * optional graphify_query — without vendoring pi-btw (~2k lines).
 */
import type { ExtensionAPI, ExtensionFactory } from "@earendil-works/pi-coding-agent";
import { installHotmilkBtwSessionHook } from "../bootstrap/btw.ts";
import { bundledImportUrl } from "../bootstrap/resolve-bundled.ts";

installHotmilkBtwSessionHook();

const upstreamModule = await import(bundledImportUrl("pi-btw/extensions/btw.ts"));
const upstream = upstreamModule.default as ExtensionFactory;

export default async function hotmilkBtw(pi: ExtensionAPI): Promise<void> {
  await upstream(pi);
}
