import { describe, expect, it } from "vite-plus/test";
import { centerAsciiLines, HOTMILK_LOGO, shouldShowSessionLogo } from "../src/ui/session-logo.ts";

describe("session logo", () => {
  it("centers the shipped banner within the terminal width", () => {
    const width = 80;
    const raw = HOTMILK_LOGO.split("\n");
    const lines = centerAsciiLines(raw, width);

    expect(lines.length).toBe(raw.length);
    for (const line of lines) {
      expect(line.length).toBeLessThanOrEqual(width);
    }
    const expectedPad = Math.floor((width - Math.max(...raw.map((l) => l.length))) / 2);
    expect(lines[0]?.slice(0, expectedPad)).toBe(" ".repeat(expectedPad));
  });

  it("pads nothing when the terminal is narrower than the banner", () => {
    const raw = HOTMILK_LOGO.split("\n");
    const maxWidth = Math.max(...raw.map((l) => l.length));
    const lines = centerAsciiLines(raw, maxWidth - 2);

    expect(lines).toEqual(raw.map((line) => line.padEnd(maxWidth)));
  });

  it("shows the splash on every session start except reload", () => {
    for (const reason of ["startup", "new", "resume", "fork"]) {
      expect(shouldShowSessionLogo(reason)).toBe(true);
    }
    expect(shouldShowSessionLogo("reload")).toBe(false);
  });
});
