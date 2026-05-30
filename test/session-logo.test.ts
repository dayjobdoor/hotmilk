import { describe, expect, it } from "vite-plus/test";
import { centerAsciiLines, shouldShowSessionLogo } from "../src/ui/session-logo.ts";

describe("session logo", () => {
  it("centers the figlet banner within the terminal width", () => {
    const width = 80;
    const raw = [
      " _        _         _ _ _   ",
      "| |_  ___| |_ _ __ (_) | |__",
      "  ' \\/ _ \\  _| '  \\| | | / /",
    ];
    const lines = centerAsciiLines(raw, width);

    expect(lines.length).toBe(3);
    for (const line of lines) {
      expect(line.length).toBeLessThanOrEqual(width);
    }
    const expectedPad = Math.floor((width - Math.max(...raw.map((l) => l.length))) / 2);
    expect(lines[0]?.slice(0, expectedPad)).toBe(" ".repeat(expectedPad));
  });

  it("shows splash on startup, new, and resume; skips reload only", () => {
    expect(shouldShowSessionLogo("startup")).toBe(true);
    expect(shouldShowSessionLogo("new")).toBe(true);
    expect(shouldShowSessionLogo("resume")).toBe(true);
    expect(shouldShowSessionLogo("fork")).toBe(true);
    expect(shouldShowSessionLogo("reload")).toBe(false);
  });
});
