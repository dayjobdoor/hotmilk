import { describe, expect, it } from "vite-plus/test";
import {
  applyHotmilkPersonaPrompt,
  shouldWarnCavemanJaConflict,
} from "../src/bootstrap/defaults.ts";

describe("caveman vs defaults.language", () => {
  it("warns only when caveman is on and the language is ja", () => {
    expect(shouldWarnCavemanJaConflict(true, "ja")).toBe(true);
    expect(shouldWarnCavemanJaConflict(true, " JA ")).toBe(true);
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

  it("replaces the persona section per persona without touching harness rules", () => {
    const gyal = applyHotmilkPersonaPrompt(gentlePrompt, "gyal");
    expect(gyal).toContain("Current persona mode: gyal");
    expect(gyal).toContain("bright, confident Japanese gyal");
    expect(gyal).toContain("Harness principles:");
    expect(gyal).not.toContain("built-in neutral rules");

    const raiden = applyHotmilkPersonaPrompt(gentlePrompt, "raiden");
    expect(raiden).toContain("Current persona mode: raiden");
    expect(raiden).toContain("知っているのか雷電！？");
    expect(raiden).toContain("preserve orchestration rules");
  });
});
