import { describe, expect, it } from "vite-plus/test";
import { BUNDLED_EXTENSION_IDS } from "../src/config/hotmilk.ts";

describe("bundled extension loaders", () => {
  it("defines a lazy loader for every bundled extension id", { timeout: 30_000 }, async () => {
    const { registerBundledExtensions } = await import("../src/bootstrap/extensions.ts");
    expect(registerBundledExtensions).toBeTypeOf("function");

    const enabled = Object.fromEntries(BUNDLED_EXTENSION_IDS.map((id) => [id, false])) as Record<
      (typeof BUNDLED_EXTENSION_IDS)[number],
      boolean
    >;

    await expect(registerBundledExtensions({} as never, enabled)).resolves.toBeUndefined();
  });
});
