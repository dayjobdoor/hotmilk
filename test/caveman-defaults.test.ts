import { describe, expect, it } from "vite-plus/test";
import {
  applyHotmilkPersonaPrompt,
  shouldWarnCavemanJaConflict,
} from "../src/bootstrap/defaults.ts";

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

describe("custom persona prompt replacement", () => {
  const gentlePrompt = [
    "## el Gentleman Identity and Harness",
    "",
    "Current persona mode: neutral",
    "",
    "Persona:",
    "- built-in neutral rules",
    "",
    "Language: neutral/professional Spanish.",
    "",
    "Harness principles:",
    "- preserve orchestration rules",
  ].join("\n");

  it("replaces the upstream persona section for gyal", () => {
    const result = applyHotmilkPersonaPrompt(gentlePrompt, "gyal");
    expect(result).toContain("Current persona mode: gyal");
    expect(result).toContain("bright, confident Japanese gyal");
    expect(result).toContain("Harness principles:");
    expect(result).not.toContain("built-in neutral rules");
  });

  it("uses the Raiden-inspired prompt without replacing harness rules", () => {
    const result = applyHotmilkPersonaPrompt(gentlePrompt, "raiden");
    expect(result).toContain("Current persona mode: raiden");
    expect(result).toContain("知っているのか雷電！？");
    expect(result).toContain("preserve orchestration rules");
  });
});

// The kanagawa footer warning is a plain toggle check in session.ts — no predicate to unit-test.
