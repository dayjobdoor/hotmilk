import { expect, it } from "vite-plus/test";
import { registerBundledExtensions } from "../src/bootstrap/extensions.ts";
import { BUNDLED_EXTENSION_IDS, type BundledExtensionId } from "../src/config/hotmilk.ts";
import { isJsonObject, isJsonString, parseJsonValue } from "../src/bootstrap/json.ts";
import { recordingPi } from "./fixtures/recording-pi.ts";

function firstArgName(args: unknown[]): string | undefined {
  const serialized = JSON.stringify(args[0]);
  if (serialized === undefined) {
    return undefined;
  }
  const parsed = parseJsonValue(serialized);
  return isJsonObject(parsed) && isJsonString(parsed.name) ? parsed.name : undefined;
}

it("registers nothing when every extension is disabled", { timeout: 30_000 }, async () => {
  // SAFETY: test fixture starts every bundled id at false.
  const enabled = {} as Record<BundledExtensionId, boolean>;
  for (const id of BUNDLED_EXTENSION_IDS) {
    enabled[id] = false;
  }
  const { pi, accessed } = recordingPi();
  await registerBundledExtensions(pi, enabled, { globalSkips: [] });
  expect(accessed).toEqual([]);
});

it(
  "registers enabled context extensions with their observable registrations",
  { timeout: 30_000 },
  async () => {
    // SAFETY: the loop below assigns every bundled id before registration.
    const enabled = {} as Record<BundledExtensionId, boolean>;
    for (const id of BUNDLED_EXTENSION_IDS) {
      enabled[id] = id === "context-view" || id === "vcc";
    }
    const { pi, accessed, calls } = recordingPi();
    await registerBundledExtensions(pi, enabled, { globalSkips: [] });

    expect(accessed).toContain("on");
    expect(
      calls.filter(({ method }) => method === "registerCommand").map(({ args }) => args[0]),
    ).toEqual(expect.arrayContaining(["pi-vcc", "pi-vcc-recall", "context"]));
    expect(
      calls.filter(({ method }) => method === "registerTool").map(({ args }) => firstArgName(args)),
    ).toContain("vcc_recall");
  },
);
