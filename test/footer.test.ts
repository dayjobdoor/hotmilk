import { describe, expect, it } from "vite-plus/test";
import { formatFooterTime } from "../src/ui/footer.ts";

describe("formatFooterTime", () => {
  it("formats as HH:mm:ss in 24-hour style", () => {
    const formatted = formatFooterTime(new Date(2026, 4, 29, 14, 5, 9));
    expect(formatted).toMatch(/14:05:09/);
  });
});
