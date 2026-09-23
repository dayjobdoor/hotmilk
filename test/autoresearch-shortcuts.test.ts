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
  it("seeds the fullscreen shortcut only when the config is missing", () => {
    const agentDir = makeTempDir("hotmilk-autoresearch-");
    const configPath = join(agentDir, "extensions", "pi-autoresearch.json");

    expect(seedAutoresearchShortcutsIfMissing(agentDir)).toEqual({
      seeded: true,
      path: configPath,
    });
    expect(parseJsonValue(readFileSync(configPath, "utf8"))).toEqual({
      shortcuts: {
        fullscreenDashboard: HOTMILK_AUTORESEARCH_FULLSCREEN_SHORTCUT,
      },
    });

    const existingDir = makeTempDir("hotmilk-autoresearch-existing-");
    const existingPath = join(existingDir, "extensions", "pi-autoresearch.json");
    const existing = { shortcuts: { fullscreenDashboard: "ctrl+shift+x", custom: "ctrl+shift+c" } };
    mkdirSync(join(existingDir, "extensions"), { recursive: true });
    writeFileSync(existingPath, `${JSON.stringify(existing)}\n`, "utf8");

    expect(seedAutoresearchShortcutsIfMissing(existingDir)).toEqual({
      seeded: false,
      path: existingPath,
    });
    expect(parseJsonValue(readFileSync(existingPath, "utf8"))).toEqual(existing);
    expect(existsSync(existingPath)).toBe(true);
  });
});
