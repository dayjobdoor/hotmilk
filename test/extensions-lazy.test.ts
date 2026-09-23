import { afterEach, expect, it, vi } from "vite-plus/test";
import * as resolveBundled from "../src/bootstrap/resolve-bundled.ts";
import { registerBundledExtensions } from "../src/bootstrap/extensions.ts";
import { isJsonObject, isJsonString, parseJsonValue } from "../src/bootstrap/json.ts";
import { recordingPi } from "./fixtures/recording-pi.ts";
import { registrationOrder, resetRegistrationOrder } from "./fixtures/order-marker-state.ts";
import { allExtensionsDisabled } from "./fixtures/runtime.ts";

const CONTEXT_MODE_MODULE = "context-mode/build/adapters/pi/extension.js";
const RTK_OPTIMIZER_MODULE = "pi-rtk-optimizer/index.ts";
const GRAPHIFY_MODULE = "@runecraft/graphify-pi/extensions/index.ts";

function fixtureUrl(path: string): string {
  return new URL(path, import.meta.url).href;
}

function stubBundledImportUrl(
  relativePath: string,
  original: typeof resolveBundled.bundledImportUrl,
): string {
  if (relativePath === CONTEXT_MODE_MODULE) {
    return fixtureUrl("./fixtures/order-marker-context-mode.ts");
  }
  if (relativePath === RTK_OPTIMIZER_MODULE) {
    return fixtureUrl("./fixtures/order-marker-rtk-optimizer.ts");
  }
  if (relativePath === GRAPHIFY_MODULE) {
    return fixtureUrl("./fixtures/order-marker-graphify.ts");
  }
  return original(relativePath);
}

function firstArgName(args: unknown[]): string | undefined {
  const serialized = JSON.stringify(args[0]);
  if (serialized === undefined) {
    return undefined;
  }
  const parsed = parseJsonValue(serialized);
  return isJsonObject(parsed) && isJsonString(parsed.name) ? parsed.name : undefined;
}

afterEach(() => {
  vi.restoreAllMocks();
  resetRegistrationOrder();
});

it(
  "lazy-loads bundled extensions: disabled registers nothing, enabled registers observably",
  { timeout: 30_000 },
  async () => {
    // The lazy gate: disabled toggles never touch the loader.
    const disabled = allExtensionsDisabled();
    const offPi = recordingPi();
    await registerBundledExtensions(offPi.pi, disabled, { globalSkips: [] });
    expect(offPi.accessed).toEqual([]);

    const enabled = allExtensionsDisabled();
    enabled["context-view"] = true;
    enabled.vcc = true;
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

it("registers context-stack extensions before parallel bundles", { timeout: 30_000 }, async () => {
  const original = resolveBundled.bundledImportUrl;
  vi.spyOn(resolveBundled, "bundledImportUrl").mockImplementation((relativePath) =>
    stubBundledImportUrl(relativePath, original),
  );

  const enabled = allExtensionsDisabled();
  enabled["context-mode"] = true;
  enabled["rtk-optimizer"] = true;
  enabled.graphify = true;

  const { pi } = recordingPi();
  await registerBundledExtensions(pi, enabled, { globalSkips: [] });

  const contextModeIndex = registrationOrder.indexOf("context-mode");
  const rtkIndex = registrationOrder.indexOf("rtk-optimizer");
  const graphifyIndex = registrationOrder.indexOf("graphify");
  expect(contextModeIndex).toBeGreaterThanOrEqual(0);
  expect(rtkIndex).toBeGreaterThan(contextModeIndex);
  expect(graphifyIndex).toBeGreaterThan(rtkIndex);
});

it("does not initialize BTW config when btw toggle is off", { timeout: 30_000 }, async () => {
  const enabled = allExtensionsDisabled();
  enabled.graphify = true;

  const { pi, accessed } = recordingPi();
  await registerBundledExtensions(pi, enabled, { globalSkips: [] });

  expect(accessed).toContain("on");
  const { getHotmilkBtwConfig } = await import("../src/bootstrap/btw.ts");
  expect(() => getHotmilkBtwConfig()).toThrow(/setHotmilkBtwConfig first/);
});

it("throws with extension id when a bundled loader fails", async () => {
  const original = resolveBundled.bundledImportUrl;
  vi.spyOn(resolveBundled, "bundledImportUrl").mockImplementation((relativePath) => {
    if (relativePath === GRAPHIFY_MODULE) {
      return fixtureUrl("./fixtures/throwing-bundled-extension.ts");
    }
    return original(relativePath);
  });

  const enabled = allExtensionsDisabled();
  enabled.graphify = true;

  const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  const { pi } = recordingPi();

  await expect(registerBundledExtensions(pi, enabled, { globalSkips: [] })).rejects.toThrow(
    '[hotmilk] Failed to load bundled extension "graphify"',
  );

  expect(consoleError).toHaveBeenCalledWith(
    expect.stringContaining('[hotmilk] Failed to load bundled extension "graphify"'),
  );
  consoleError.mockRestore();
});
