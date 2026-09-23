import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { registrationOrder } from "./order-marker-state.ts";

export default async function registerOrderMarker(_pi: ExtensionAPI): Promise<void> {
  registrationOrder.push("rtk-optimizer");
}
