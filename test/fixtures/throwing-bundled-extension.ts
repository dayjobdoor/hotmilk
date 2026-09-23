import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default async function registerThrowingBundledExtension(_pi: ExtensionAPI): Promise<void> {
  throw new Error("fixture load failed");
}
