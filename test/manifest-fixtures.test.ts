import { describe, expect, it } from "vite-plus/test";
import { normalizeSemver, semverAtLeast } from "./fixtures/manifest.ts";

describe("manifest fixtures — semver helpers", () => {
  describe("normalizeSemver", () => {
    it.each([
      ["^0.10.2", "0.10.2"],
      [">=0.80.0", "0.80.0"],
      ["~1.2.3", "1.2.3"],
      ["v0.74.5-beta.1", "0.74.5"],
      ["*", "0.0.0"],
    ])("strips range prefix from %s", (input, expected) => {
      expect(normalizeSemver(input)).toBe(expected);
    });
  });

  describe("semverAtLeast", () => {
    it.each([
      ["0.10.2", "^0.10.2", true],
      ["0.10.1", "^0.10.2", false],
      ["0.80.2", "0.80.0", true],
      ["0.74.5", ">=0.80.0", false],
      ["1.0.0-rc.1", "^1.0.0", true],
    ])("naive semverAtLeast compares %s against floor %s → %s", (version, floor, expected) => {
      expect(semverAtLeast(version, floor)).toBe(expected);
    });
  });
});
