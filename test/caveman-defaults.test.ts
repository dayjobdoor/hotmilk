import { describe, expect, it } from "vite-plus/test";
import { shouldWarnCavemanJaConflict } from "../src/bootstrap/defaults.ts";

describe("caveman vs defaults.language", () => {
  it("warns when caveman is on and language is ja", () => {
    expect(shouldWarnCavemanJaConflict(true, "ja")).toBe(true);
    expect(shouldWarnCavemanJaConflict(true, " JA ")).toBe(true);
  });

  it("does not warn when caveman is off or language is not ja", () => {
    expect(shouldWarnCavemanJaConflict(false, "ja")).toBe(false);
    expect(shouldWarnCavemanJaConflict(true, "en")).toBe(false);
    expect(shouldWarnCavemanJaConflict(true, undefined)).toBe(false);
  });
});

// The kanagawa footer warning is a plain toggle check in session.ts — no predicate to unit-test.
