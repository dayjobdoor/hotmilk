import type { BundledExtensionId } from "../../src/config/bundled-extensions.ts";

/** Registration order recorded by order-marker fixtures. */
export const registrationOrder: BundledExtensionId[] = [];

/** Clear order between tests. */
export function resetRegistrationOrder(): void {
  registrationOrder.length = 0;
}
