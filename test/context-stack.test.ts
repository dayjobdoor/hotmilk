import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vite-plus/test";
import {
  buildHotmilkRtkConfig,
  expectedRtkMode,
  seedRtkConfigIfMissing,
  syncRtkConfigForContextStack,
} from "../src/bootstrap/context-stack.ts";

describe("context-stack", () => {
  const tempDirs: string[] = [];

  afterEach(() => {
    for (const dir of tempDirs) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("maps context-mode toggle to suggest mode and rewrite when off", () => {
    expect(expectedRtkMode(true)).toBe("suggest");
    expect(expectedRtkMode(false)).toBe("rewrite");
    expect((buildHotmilkRtkConfig(true) as { mode: string }).mode).toBe("suggest");
    expect((buildHotmilkRtkConfig(false) as { mode: string }).mode).toBe("rewrite");
  });

  it("seedRtkConfigIfMissing writes config once", () => {
    const agentDir = mkdtempSync(join(tmpdir(), "hotmilk-rtk-"));
    tempDirs.push(agentDir);
    const configPath = join(agentDir, "config.json");

    const first = seedRtkConfigIfMissing(true, configPath);
    const second = seedRtkConfigIfMissing(true, configPath);

    expect(first.seeded).toBe(true);
    expect(second.seeded).toBe(false);

    const written = JSON.parse(readFileSync(configPath, "utf8")) as {
      mode: string;
      outputCompaction: { readCompaction: { enabled: boolean } };
    };
    expect(written.mode).toBe("suggest");
    expect(written.outputCompaction.readCompaction.enabled).toBe(false);
  });

  it("syncRtkConfigForContextStack updates stale mode when context-mode is on", () => {
    const agentDir = mkdtempSync(join(tmpdir(), "hotmilk-rtk-sync-"));
    tempDirs.push(agentDir);
    const configPath = join(agentDir, "config.json");

    writeFileSync(
      configPath,
      `${JSON.stringify({ mode: "rewrite", outputCompaction: { readCompaction: { enabled: true } } }, null, 2)}\n`,
      "utf8",
    );

    const result = syncRtkConfigForContextStack(true, true, configPath);
    const written = JSON.parse(readFileSync(configPath, "utf8")) as {
      mode: string;
      outputCompaction: { readCompaction: { enabled: boolean } };
    };

    expect(result.updated).toBe(true);
    expect(result.seeded).toBe(false);
    expect(written.mode).toBe("suggest");
    expect(written.outputCompaction.readCompaction.enabled).toBe(false);
  });

  it("syncRtkConfigForContextStack leaves rewrite mode when context-mode is off", () => {
    const agentDir = mkdtempSync(join(tmpdir(), "hotmilk-rtk-off-"));
    tempDirs.push(agentDir);
    const configPath = join(agentDir, "config.json");

    writeFileSync(
      configPath,
      `${JSON.stringify({ mode: "rewrite", outputCompaction: { readCompaction: { enabled: true } } }, null, 2)}\n`,
      "utf8",
    );

    const result = syncRtkConfigForContextStack(false, true, configPath);
    const written = JSON.parse(readFileSync(configPath, "utf8")) as {
      mode: string;
      outputCompaction: { readCompaction: { enabled: boolean } };
    };

    expect(result.updated).toBe(false);
    expect(result.seeded).toBe(false);
    expect(written.mode).toBe("rewrite");
    expect(written.outputCompaction.readCompaction.enabled).toBe(true);
  });

  it("syncRtkConfigForContextStack no-ops when rtk toggle is off", () => {
    const agentDir = mkdtempSync(join(tmpdir(), "hotmilk-rtk-disabled-"));
    tempDirs.push(agentDir);
    const configPath = join(agentDir, "config.json");

    writeFileSync(configPath, `${JSON.stringify({ mode: "rewrite" }, null, 2)}\n`, "utf8");

    const result = syncRtkConfigForContextStack(true, false, configPath);

    expect(result.updated).toBe(false);
    expect(result.seeded).toBe(false);
    expect(JSON.parse(readFileSync(configPath, "utf8"))).toEqual({ mode: "rewrite" });
  });

  it("syncRtkConfigForContextStack reports error for corrupted JSON instead of throwing", () => {
    const agentDir = mkdtempSync(join(tmpdir(), "hotmilk-rtk-corrupt-"));
    tempDirs.push(agentDir);
    const configPath = join(agentDir, "config.json");

    writeFileSync(configPath, "not json", "utf8");

    const result = syncRtkConfigForContextStack(true, true, configPath);

    expect(result.updated).toBe(false);
    expect(result.seeded).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("seedRtkConfigIfMissing reports error when config dir is not writable", () => {
    // Skip on Windows where chmod semantics differ.
    if (process.platform === "win32") {
      return;
    }

    const agentDir = mkdtempSync(join(tmpdir(), "hotmilk-rtk-ro-"));
    tempDirs.push(agentDir);
    const configPath = join(agentDir, "nested", "config.json");

    chmodSync(agentDir, 0o555);

    const result = seedRtkConfigIfMissing(true, configPath);

    expect(result.seeded).toBe(false);
    expect(result.error).toBeDefined();
  });
});
