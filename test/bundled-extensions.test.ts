import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import {
  BUNDLED_EXTENSION_DEFINITIONS,
  BUNDLED_EXTENSION_GROUP_ORDER,
  BUNDLED_EXTENSION_GROUPS,
  BUNDLED_EXTENSION_IDS,
  BUNDLED_EXTENSION_PACKAGES,
  CONTEXT_STACK_EXTENSION_IDS,
} from "../src/config/bundled-extensions.ts";
import {
  detectGlobalProviderForBundledExtension,
  packageNamesForBundledExtension,
} from "../src/config/bundled-package-registry.ts";

const PACKAGE_JSON = JSON.parse(
  readFileSync(join(import.meta.dirname, "../package.json"), "utf8"),
) as { dependencies?: Record<string, string> };

describe("bundled extension manifest", () => {
  it("keeps ids aligned with derived tables", () => {
    expect(BUNDLED_EXTENSION_IDS).toHaveLength(BUNDLED_EXTENSION_DEFINITIONS.length);
    for (const definition of BUNDLED_EXTENSION_DEFINITIONS) {
      expect(BUNDLED_EXTENSION_PACKAGES[definition.id]).toEqual(definition.package);
    }
  });

  it("covers every id in /mode groups", () => {
    const grouped = new Set(BUNDLED_EXTENSION_GROUPS.flatMap((group) => group.ids));
    for (const id of BUNDLED_EXTENSION_IDS) {
      expect(grouped.has(id)).toBe(true);
    }
  });

  it("uses only declared group labels", () => {
    const allowed = new Set<string>(BUNDLED_EXTENSION_GROUP_ORDER);
    for (const definition of BUNDLED_EXTENSION_DEFINITIONS) {
      expect(allowed.has(definition.group)).toBe(true);
    }
  });

  it("lists npm dependencies for every primary package", () => {
    const deps = new Set(Object.keys(PACKAGE_JSON.dependencies ?? {}));
    for (const definition of BUNDLED_EXTENSION_DEFINITIONS) {
      expect(deps.has(definition.package.packageName)).toBe(true);
    }
  });

  it("orders context stack from loadPhase", () => {
    expect(CONTEXT_STACK_EXTENSION_IDS).toEqual(["context-mode", "rtk-optimizer"]);
  });

  it("resolves global provider via aliases", () => {
    const installed = new Set(["@blackbelt-technology/pi-dashboard-extension"]);
    expect(detectGlobalProviderForBundledExtension("agent-dashboard", installed)).toBe(
      "@blackbelt-technology/pi-dashboard-extension",
    );
    expect(packageNamesForBundledExtension("agent-dashboard")).toContain(
      "@blackbelt-technology/pi-dashboard-extension",
    );
  });
});
