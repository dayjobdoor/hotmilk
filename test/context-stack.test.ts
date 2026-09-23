import { readFileSync, writeFileSync } from "node:fs";
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
  // SAFETY: test wrote this file with WrittenRtkConfig layout.
  return parseJsonValue(readFileSync(configPath, "utf8")) as WrittenRtkConfig;
}

describe("context-stack", () => {
  it("maps context-mode toggle to suggest mode and rewrite when off", () => {
    expect(expectedRtkMode(true)).toBe("suggest");
    expect(expectedRtkMode(false)).toBe("rewrite");
    expect(buildHotmilkRtkConfig(true).mode).toBe("suggest");
    expect(buildHotmilkRtkConfig(false).mode).toBe("rewrite");
  });

  it("seedRtkConfigIfMissing seeds only when the config is missing", () => {
    const agentDir = makeTempDir("hotmilk-rtk-");
    const configPath = join(agentDir, "config.json");

    const seeded = seedRtkConfigIfMissing(true, configPath);
    expect(seeded).toEqual({ seeded: true, path: configPath });
    const written = readWrittenRtkConfig(configPath);
    expect(written.mode).toBe("suggest");
    expect(written.outputCompaction.readCompaction.enabled).toBe(false);

    const existingDir = makeTempDir("hotmilk-rtk-existing-");
    const existingPath = join(existingDir, "config.json");
    const existing = { mode: "rewrite", custom: { keep: true } };
    writeFileSync(existingPath, `${JSON.stringify(existing)}\n`, "utf8");

    expect(seedRtkConfigIfMissing(true, existingPath)).toEqual({
      seeded: false,
      path: existingPath,
    });
    expect(parseJsonValue(readFileSync(existingPath, "utf8"))).toEqual(existing);
  });

  it("syncRtkConfigForContextStack updates stale mode and seeds missing config", () => {
    const staleDir = makeTempDir("hotmilk-rtk-sync-");
    const stalePath = join(staleDir, "config.json");

    writeFileSync(
      stalePath,
      `${JSON.stringify({ mode: "rewrite", outputCompaction: { readCompaction: { enabled: true } }, custom: { keep: true } }, null, 2)}\n`,
      "utf8",
    );

    const staleResult = syncRtkConfigForContextStack(true, true, stalePath);
    const staleWritten = readWrittenRtkConfig(stalePath);

    expect(staleResult.updated).toBe(true);
    expect(staleResult.seeded).toBe(false);
    expect(staleWritten.mode).toBe("suggest");
    expect(staleWritten.outputCompaction.readCompaction.enabled).toBe(false);
    expect(parseJsonValue(readFileSync(stalePath, "utf8"))).toMatchObject({
      custom: { keep: true },
    });

    // A missing config is seeded with the same call.
    const missingPath = join(makeTempDir("hotmilk-rtk-sync-missing-"), "config.json");
    expect(syncRtkConfigForContextStack(true, true, missingPath)).toEqual({
      updated: true,
      seeded: true,
      path: missingPath,
    });
    expect(readWrittenRtkConfig(missingPath).mode).toBe("suggest");
  });

  it("syncRtkConfigForContextStack leaves configs untouched when context-mode or the rtk toggle is off", () => {
    // context-mode off → rewrite mode stays, readCompaction untouched.
    const contextOffPath = join(makeTempDir("hotmilk-rtk-off-"), "config.json");
    writeFileSync(
      contextOffPath,
      `${JSON.stringify({ mode: "rewrite", outputCompaction: { readCompaction: { enabled: true } } }, null, 2)}\n`,
      "utf8",
    );

    const result = syncRtkConfigForContextStack(false, true, contextOffPath);
    const written = readWrittenRtkConfig(contextOffPath);

    expect(result.updated).toBe(false);
    expect(result.seeded).toBe(false);
    expect(written.mode).toBe("rewrite");
    expect(written.outputCompaction.readCompaction.enabled).toBe(true);

    // rtk toggle off → the file is not touched at all.
    const rtkOffPath = join(makeTempDir("hotmilk-rtk-disabled-"), "config.json");
    writeFileSync(rtkOffPath, `${JSON.stringify({ mode: "rewrite" }, null, 2)}\n`, "utf8");

    const rtkOffResult = syncRtkConfigForContextStack(true, false, rtkOffPath);

    expect(rtkOffResult.updated).toBe(false);
    expect(rtkOffResult.seeded).toBe(false);
    expect(parseJsonValue(readFileSync(rtkOffPath, "utf8"))).toEqual({ mode: "rewrite" });
  });

  it("reports errors instead of throwing for unwritable paths and corrupted JSON", () => {
    const corruptDir = makeTempDir("hotmilk-rtk-corrupt-");
    const corruptPath = join(corruptDir, "config.json");
    writeFileSync(corruptPath, "not json", "utf8");
    const corruptResult = syncRtkConfigForContextStack(true, true, corruptPath);
    expect(corruptResult.updated).toBe(false);
    expect(corruptResult.seeded).toBe(false);
    expect(corruptResult.error).toEqual(expect.any(String));

    const fileAncestor = join(makeTempDir("hotmilk-rtk-error-"), "not-a-directory");
    writeFileSync(fileAncestor, "", "utf8");
    const ancestorResult = seedRtkConfigIfMissing(true, join(fileAncestor, "config.json"));
    expect(ancestorResult.seeded).toBe(false);
    expect(ancestorResult.error).toEqual(expect.any(String));
  });
});
