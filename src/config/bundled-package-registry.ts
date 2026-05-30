import {
  BUNDLED_EXTENSION_PACKAGES,
  type BundledExtensionId,
  type BundledPackageSpec,
} from "./bundled-extensions.ts";

export type { BundledPackageSpec };

export { BUNDLED_EXTENSION_PACKAGES };

export const HOTMILK_PACKAGE_NAME = "hotmilk";

export function packageNamesForBundledExtension(id: BundledExtensionId): readonly string[] {
  const spec = BUNDLED_EXTENSION_PACKAGES[id];
  return spec.aliases ? [spec.packageName, ...spec.aliases] : [spec.packageName];
}

export function detectGlobalProviderForBundledExtension(
  id: BundledExtensionId,
  installedPackageNames: ReadonlySet<string>,
): string | undefined {
  for (const name of packageNamesForBundledExtension(id)) {
    if (installedPackageNames.has(name)) {
      return name;
    }
  }
  return undefined;
}
