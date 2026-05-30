import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { buildHotmilkRtkConfig, seedRtkConfigIfMissing } from "../src/bootstrap/rtk-coexist.ts";

describe("rtk-coexist", () => {
  const tempDirs: string[] = [];

  afterEach(() => {
    for (const dir of tempDirs) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("buildHotmilkRtkConfig uses suggest mode when context-mode is enabled", () => {
    const withCtx = buildHotmilkRtkConfig(true) as { mode: string };
    const withoutCtx = buildHotmilkRtkConfig(false) as { mode: string };

    expect(withCtx.mode).toBe("suggest");
    expect(withoutCtx.mode).toBe("rewrite");
  });

  it("seedRtkConfigIfMissing writes config once", () => {
    const agentDir = mkdtempSync(join(tmpdir(), "hotmilk-rtk-"));
    tempDirs.push(agentDir);
    const configPath = join(agentDir, "config.json");

    const first = seedRtkConfigIfMissing(true, configPath);
    const second = seedRtkConfigIfMissing(true, configPath);

    expect(first.seeded).toBe(true);
    expect(second.seeded).toBe(false);
    expect(existsSync(configPath)).toBe(true);

    const written = JSON.parse(readFileSync(configPath, "utf8")) as {
      mode: string;
      outputCompaction: { readCompaction: { enabled: boolean } };
    };
    expect(written.mode).toBe("suggest");
    expect(written.outputCompaction.readCompaction.enabled).toBe(false);
  });
});
