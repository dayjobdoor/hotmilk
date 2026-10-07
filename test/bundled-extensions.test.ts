import { existsSync } from "node:fs";
import { describe, expect, it } from "vite-plus/test";
import { bundledImportUrl, resolveBundledModule } from "../src/bootstrap/resolve-bundled.ts";
import {
  BUNDLED_EXTENSION_DEFINITIONS,
  BUNDLED_EXTENSION_GROUPS,
  BUNDLED_EXTENSION_IDS,
  CONTEXT_STACK_EXTENSION_IDS,
} from "../src/config/bundled-extensions.ts";
import { PACKAGE_JSON } from "./fixtures/manifest.ts";

describe("bundled extension manifest", () => {
  it("covers every id in /mode groups exactly once", () => {
    const grouped = new Set(BUNDLED_EXTENSION_GROUPS.flatMap((group) => group.ids));
    expect(grouped.size).toBe(BUNDLED_EXTENSION_IDS.length);
    for (const id of BUNDLED_EXTENSION_IDS) {
      expect(grouped.has(id)).toBe(true);
    }
  });

  it("lists npm dependencies for every external bundled package", () => {
    const deps = new Set(Object.keys(PACKAGE_JSON.dependencies ?? {}));
    for (const definition of BUNDLED_EXTENSION_DEFINITIONS) {
      // Self-owned modules (hotmilk/src/…) ship inside hotmilk — no external dep.
      if (definition.module.startsWith("hotmilk/")) continue;
      expect(deps.has(definition.packageName), `${definition.id} dep`).toBe(true);
    }
  });

  it("resolves every bundled module path on disk", () => {
    for (const definition of BUNDLED_EXTENSION_DEFINITIONS) {
      const resolved = resolveBundledModule(definition.module, import.meta.url);
      expect(existsSync(resolved), `${definition.id}: ${definition.module}`).toBe(true);
    }
  });

  // Dependencies float on caret ranges and CI only runs the lockfile tree, so a row whose
  // module fails to import or lacks a default factory must fail here, not at a user's startup.
  it(
    "imports every bundled module and exposes a default extension factory",
    { timeout: 120_000 },
    async () => {
      const broken: string[] = [];
      for (const definition of BUNDLED_EXTENSION_DEFINITIONS) {
        try {
          const mod = await import(bundledImportUrl(definition.module));
          if (!(mod.default instanceof Function)) broken.push(`${definition.id}: no default factory`);
        } catch (cause) {
          broken.push(`${definition.id}: ${cause instanceof Error ? cause.message : String(cause)}`);
        }
      }
      expect(broken).toEqual([]);
    },
  );

  it("orders the context stack: context-mode before rtk-optimizer", () => {
    expect(CONTEXT_STACK_EXTENSION_IDS).toEqual(["context-mode", "rtk-optimizer"]);
  });
});
