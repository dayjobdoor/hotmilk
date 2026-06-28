import { describe, expect, it } from "vite-plus/test";
import { BUNDLED_EXTENSION_IDS } from "../src/config/hotmilk.ts";

describe("registerBundledExtensions", () => {
  it("completes with every extension disabled", { timeout: 30_000 }, async () => {
    const { registerBundledExtensions } = await import("../src/bootstrap/extensions.ts");

    const enabled = Object.fromEntries(BUNDLED_EXTENSION_IDS.map((id) => [id, false])) as Record<
      (typeof BUNDLED_EXTENSION_IDS)[number],
      boolean
    >;

    await expect(
      registerBundledExtensions({} as never, enabled, { globalSkips: [] }),
    ).resolves.toEqual({ globalSkips: [] });
  });
});
