import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vite-plus/test";
import {
  buildHotmilkRtkConfig,
  CONTEXT_STACK_EXTENSION_IDS,
  expectedRtkMode,
  seedRtkConfigIfMissing,
  syncRtkConfigForContextStack,
} from "../src/bootstrap/context-stack.ts";
import { BUNDLED_EXTENSION_IDS } from "../src/config/hotmilk.ts";

describe("context-stack", () => {
  const tempDirs: string[] = [];

  afterEach(() => {
    for (const dir of tempDirs) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("CONTEXT_STACK_EXTENSION_IDS are bundled extension ids", () => {
    for (const id of CONTEXT_STACK_EXTENSION_IDS) {
      expect(BUNDLED_EXTENSION_IDS).toContain(id);
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

  it("expectedRtkMode prefers suggest when context-mode is enabled", () => {
    expect(expectedRtkMode(true)).toBe("suggest");
    expect(expectedRtkMode(false)).toBe("rewrite");
  });
});
