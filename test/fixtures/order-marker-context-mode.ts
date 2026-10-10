import { registrationOrder } from "./order-marker-state.ts";

export default async function registerOrderMarker(): Promise<void> {
  registrationOrder.push("context-mode");
}
