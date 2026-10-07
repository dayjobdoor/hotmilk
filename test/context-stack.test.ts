import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { alignRtkConfig, prepareContextStack, syncRtkConfig } from "../src/bootstrap/context-stack.ts";
import { parseJsonValue } from "../src/bootstrap/json.ts";
import { allExtensionsDisabled } from "./fixtures/runtime.ts";
import { makeTempDir } from "./fixtures/tmp.ts";

describe("alignRtkConfig (pure)", () => {
  it("seeds a default whose mode follows context-mode (suggest on, rewrite off)", () => {
    const on = alignRtkConfig(undefined, true);
    expect(on.changed).toBe(true);
    expect(on.config).toMatchObject({ mode: "suggest", outputCompaction: { readCompaction: { enabled: false } } });
    expect(alignRtkConfig(undefined, false).config).toMatchObject({ mode: "rewrite" });
  });

  it("fixes only hotmilk-managed fields and keeps user keys", () => {
    const stale = { mode: "rewrite", custom: 1, outputCompaction: { readCompaction: { enabled: true }, trackSavings: false } };
    const aligned = alignRtkConfig(stale, true);
    expect(aligned.changed).toBe(true);
    expect(aligned.config).toEqual({
      mode: "suggest",
      custom: 1,
      outputCompaction: { readCompaction: { enabled: false }, trackSavings: false },
    });
    // Without context-mode, mode and readCompaction are the user's call: nothing is rewritten.
    expect(alignRtkConfig({ mode: "rewrite", outputCompaction: { readCompaction: { enabled: true } } }, false).changed).toBe(false);
    expect(alignRtkConfig({ mode: "suggest" }, false).changed).toBe(false);
    expect(alignRtkConfig(aligned.config, true)).toEqual({ config: aligned.config, changed: false });
  });
});

describe("syncRtkConfig", () => {
  it("seeds, updates, leaves aligned files alone, and reports failures instead of throwing", () => {
    const dir = makeTempDir("hotmilk-rtk-");
    const path = join(dir, "nested", "config.json");
    expect(syncRtkConfig(true, path)).toEqual({ path, outcome: "seeded" });
    expect(syncRtkConfig(true, path)).toEqual({ path, outcome: "unchanged" });

    writeFileSync(path, JSON.stringify({ mode: "rewrite", keep: true }), "utf8");
    expect(syncRtkConfig(true, path)).toEqual({ path, outcome: "updated" });
    expect(parseJsonValue(readFileSync(path, "utf8"))).toMatchObject({ mode: "suggest", keep: true });

    writeFileSync(path, "{not json", "utf8");
    expect(syncRtkConfig(true, path)).toMatchObject({ path, outcome: "failed", error: expect.any(String) });
  });
});

describe("prepareContextStack", () => {
  it("syncs only when rtk-optimizer is on", () => {
    const toggles = allExtensionsDisabled();
    expect(prepareContextStack(toggles)).toBeUndefined();
  });
});
