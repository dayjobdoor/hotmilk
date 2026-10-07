import { describe, expect, it } from "vite-plus/test";
import { OMP_BUNDLED_LOADERS } from "../src/bootstrap/omp-loaders.js";
import { bundledImportUrl } from "../src/bootstrap/resolve-bundled.ts";
import {
  BUNDLED_EXTENSION_DEFINITIONS,
  BUNDLED_EXTENSION_IDS,
  OMP_SUPPORTED_IDS,
} from "../src/config/bundled-extensions.ts";

// omp-flagged rows that load through the Pi loader because their entry is not an exported subpath.
const PI_LOADER_FALLBACK = ["context-mode", "ponytail"];

describe("omp loader table", () => {
  // A wrong specifier would load a different module under omp than under Pi, and the audit
  // cannot tell that from a row that simply does not work there.
  it(
    "every omp loader yields the module its registry row loads under Pi",
    { timeout: 120_000 },
    async () => {
      const wrong: string[] = [];
      for (const definition of BUNDLED_EXTENSION_DEFINITIONS) {
        const load = OMP_BUNDLED_LOADERS[definition.id];
        if (load === undefined) continue;
        const underPi = await import(bundledImportUrl(definition.module));
        if ((await load()) !== underPi) wrong.push(definition.id);
      }
      expect(wrong).toEqual([]);
    },
  );

  it("has no loader for an id the registry does not know", () => {
    const unknown = Object.keys(OMP_BUNDLED_LOADERS).filter(
      (id) => !BUNDLED_EXTENSION_IDS.some((known) => known === id),
    );
    expect(unknown).toEqual([]);
  });

  it("has a loader for every omp-flagged row except the documented Pi-loader fallbacks", () => {
    const missing = OMP_SUPPORTED_IDS.filter((id) => OMP_BUNDLED_LOADERS[id] === undefined);
    expect([...missing].sort()).toEqual([...PI_LOADER_FALLBACK].sort());
  });
});
