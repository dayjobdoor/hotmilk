import { Type } from "typebox";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { registrationOrder } from "./order-marker-state.ts";

export default async function registerOrderMarker(pi: ExtensionAPI): Promise<void> {
  registrationOrder.push("context-mode");
  pi.registerTool({
    name: "ctx_search",
    label: "ctx_search",
    description: "ctx_search order marker",
    parameters: Type.Object({}),
    execute: async () => ({
      content: [{ type: "text", text: "ctx_search marker" }],
      details: undefined,
    }),
  });
}
