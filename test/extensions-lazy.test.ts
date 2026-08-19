import { expect, it } from "vite-plus/test";
import { registerBundledExtensions } from "../src/bootstrap/extensions.ts";
import { BUNDLED_EXTENSION_IDS, type BundledExtensionId } from "../src/config/hotmilk.ts";
import { recordingPi } from "./fixtures/recording-pi.ts";

it("registers nothing when every extension is disabled", { timeout: 30_000 }, async () => {
  // SAFETY: test fixture starts every bundled id at false.
  const enabled = {} as Record<BundledExtensionId, boolean>;
  for (const id of BUNDLED_EXTENSION_IDS) {
    enabled[id] = false;
  }
  const { pi, accessed } = recordingPi();
  await registerBundledExtensions(pi, enabled);
  expect(accessed).toEqual([]);
});
