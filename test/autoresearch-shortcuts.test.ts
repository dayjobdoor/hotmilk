import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import {
  HOTMILK_AUTORESEARCH_FULLSCREEN_SHORTCUT,
  seedAutoresearchShortcutsIfMissing,
} from "../src/bootstrap/autoresearch.ts";
import { parseJsonValue } from "../src/bootstrap/json.ts";
import { makeTempDir } from "./fixtures/tmp.ts";

describe("autoresearch shortcuts", () => {
  it("seeds a non-conflicting fullscreen shortcut when missing", () => {
    const agentDir = makeTempDir("hotmilk-autoresearch-");
    const configPath = join(agentDir, "extensions", "pi-autoresearch.json");

    const result = seedAutoresearchShortcutsIfMissing(agentDir);

    expect(result).toEqual({ seeded: true, path: configPath });
    expect(existsSync(configPath)).toBe(true);
    expect(parseJsonValue(readFileSync(configPath, "utf8"))).toEqual({
      shortcuts: {
        fullscreenDashboard: HOTMILK_AUTORESEARCH_FULLSCREEN_SHORTCUT,
      },
    });
  });

  it("preserves an existing shortcut config", () => {
    const agentDir = makeTempDir("hotmilk-autoresearch-existing-");
    const configPath = join(agentDir, "extensions", "pi-autoresearch.json");
    const existing = { shortcuts: { fullscreenDashboard: "ctrl+shift+x", custom: "ctrl+shift+c" } };
    mkdirSync(join(agentDir, "extensions"), { recursive: true });
    writeFileSync(configPath, `${JSON.stringify(existing)}\n`, "utf8");

    const result = seedAutoresearchShortcutsIfMissing(agentDir);

    expect(result).toEqual({ seeded: false, path: configPath });
    expect(parseJsonValue(readFileSync(configPath, "utf8"))).toEqual(existing);
  });
});
