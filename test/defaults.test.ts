import { describe, expect, it } from "vite-plus/test";
import { applyHotmilkPersonaPrompt, markdownSection } from "../src/bootstrap/defaults.ts";

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
    const raiden = applyHotmilkPersonaPrompt(gentlePrompt, "raiden");
    for (const [persona, prompt] of [
      ["gyal", gyal],
      ["raiden", raiden],
    ]) {
      expect(prompt).toContain(`Current persona mode: ${persona}`);
      expect(prompt).not.toContain("built-in neutral rules");
      expect(prompt).toContain("preserve orchestration rules");
    }
    expect(gyal).not.toBe(raiden);
  });
});

describe("markdownSection", () => {
  it("returns one section body, stops at the next section, and is empty when absent", () => {
    const md = "# T\n\n## a\n\nA body\n\n## b\nB body\n";
    expect(markdownSection(md, "a")).toBe("A body");
    expect(markdownSection(md, "b")).toBe("B body");
    expect(markdownSection(md, "c")).toBe("");
  });
});
