import { chmodSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import {
  buildHotmilkRtkConfig,
  expectedRtkMode,
  seedRtkConfigIfMissing,
  syncRtkConfigForContextStack,
} from "../src/bootstrap/context-stack.ts";
import { parseJsonValue } from "../src/bootstrap/json.ts";
import { makeTempDir } from "./fixtures/tmp.ts";

type WrittenRtkConfig = {
  mode: string;
  outputCompaction: { readCompaction: { enabled: boolean } };
};

function readWrittenRtkConfig(configPath: string): WrittenRtkConfig {
  // SAFETY: test wrote this file with WrittenRtkConfig shape.
  return parseJsonValue(readFileSync(configPath, "utf8")) as WrittenRtkConfig;
}

describe("context-stack", () => {
  it("maps context-mode toggle to suggest mode and rewrite when off", () => {
    expect(expectedRtkMode(true)).toBe("suggest");
    expect(expectedRtkMode(false)).toBe("rewrite");
    expect(buildHotmilkRtkConfig(true).mode).toBe("suggest");
    expect(buildHotmilkRtkConfig(false).mode).toBe("rewrite");
  });

  it("seedRtkConfigIfMissing writes config once", () => {
    const agentDir = makeTempDir("hotmilk-rtk-");
    const configPath = join(agentDir, "config.json");

    const first = seedRtkConfigIfMissing(true, configPath);
    const second = seedRtkConfigIfMissing(true, configPath);

    expect(first.seeded).toBe(true);
    expect(second.seeded).toBe(false);

    const written = readWrittenRtkConfig(configPath);
    expect(written.mode).toBe("suggest");
    expect(written.outputCompaction.readCompaction.enabled).toBe(false);
  });

  it("syncRtkConfigForContextStack updates stale mode when context-mode is on", () => {
    const agentDir = makeTempDir("hotmilk-rtk-sync-");
    const configPath = join(agentDir, "config.json");

    writeFileSync(
      configPath,
      `${JSON.stringify({ mode: "rewrite", outputCompaction: { readCompaction: { enabled: true } } }, null, 2)}\n`,
      "utf8",
    );

    const result = syncRtkConfigForContextStack(true, true, configPath);
    const written = readWrittenRtkConfig(configPath);

    expect(result.updated).toBe(true);
    expect(result.seeded).toBe(false);
    expect(written.mode).toBe("suggest");
    expect(written.outputCompaction.readCompaction.enabled).toBe(false);
  });

  it("syncRtkConfigForContextStack leaves rewrite mode when context-mode is off", () => {
    const agentDir = makeTempDir("hotmilk-rtk-off-");
    const configPath = join(agentDir, "config.json");

    writeFileSync(
      configPath,
      `${JSON.stringify({ mode: "rewrite", outputCompaction: { readCompaction: { enabled: true } } }, null, 2)}\n`,
      "utf8",
    );

    const result = syncRtkConfigForContextStack(false, true, configPath);
    const written = readWrittenRtkConfig(configPath);

    expect(result.updated).toBe(false);
    expect(result.seeded).toBe(false);
    expect(written.mode).toBe("rewrite");
    expect(written.outputCompaction.readCompaction.enabled).toBe(true);
  });

  it("syncRtkConfigForContextStack no-ops when rtk toggle is off", () => {
    const agentDir = makeTempDir("hotmilk-rtk-disabled-");
    const configPath = join(agentDir, "config.json");

    writeFileSync(configPath, `${JSON.stringify({ mode: "rewrite" }, null, 2)}\n`, "utf8");

    const result = syncRtkConfigForContextStack(true, false, configPath);

    expect(result.updated).toBe(false);
    expect(result.seeded).toBe(false);
    expect(parseJsonValue(readFileSync(configPath, "utf8"))).toEqual({ mode: "rewrite" });
  });

  it("syncRtkConfigForContextStack reports error for corrupted JSON instead of throwing", () => {
    const agentDir = makeTempDir("hotmilk-rtk-corrupt-");
    const configPath = join(agentDir, "config.json");

    writeFileSync(configPath, "not json", "utf8");

    const result = syncRtkConfigForContextStack(true, true, configPath);

    expect(result.updated).toBe(false);
    expect(result.seeded).toBe(false);
    expect(result.error).toEqual(expect.any(String));
  });

  it("seedRtkConfigIfMissing reports error when config dir is not writable", () => {
    // Skip on Windows where chmod semantics differ.
    if (process.platform === "win32") {
      return;
    }

    const agentDir = makeTempDir("hotmilk-rtk-ro-");
    const configPath = join(agentDir, "nested", "config.json");

    chmodSync(agentDir, 0o555);

    const result = seedRtkConfigIfMissing(true, configPath);

    expect(result.seeded).toBe(false);
    expect(result.error).toEqual(expect.any(String));
  });
});
