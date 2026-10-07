import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import {
  BUNDLED_EXTENSION_IDS,
  OMP_SUPPORTED_IDS,
  PRE_0_2_DEFAULT_ON_IDS,
} from "../src/config/bundled-extensions.ts";
import {
  tildePath,
  DEFAULT_HOTMILK_CONFIG,
  getHotmilkConfigPath,
  hotmilkConfigDisplayPath,
  legacyDefaultsLost,
  loadHotmilkConfig,
  markDefaultOffNoticeSeen,
  resolveBundledExtensionToggles,
  resolveDefaults,
  resolveGraphSettings,
  resolveHotmilkConfigRoot,
  resolveProjectTrust,
  seedHotmilkConfigIfMissing,
} from "../src/config/hotmilk.ts";
import { makeTempDir } from "./fixtures/tmp.ts";
import { setEnv, withConfigEnv } from "./fixtures/runtime.ts";
import { parseJsonValue } from "../src/bootstrap/json.ts";
import { createHotmilkRuntime } from "../src/config/runtime.ts";

function tempConfigDir(): string {
  return makeTempDir("hotmilk-test-");
}
describe("resolveBundledExtensionToggles", () => {
  it("defaults every bundled id off (0.2.0 minimal core) and honors explicit opt-in", () => {
    const toggles = resolveBundledExtensionToggles({});
    for (const id of BUNDLED_EXTENSION_IDS) {
      expect(toggles[id], `${id} must default off`).toBe(false);
    }
    // An explicit opt-in flips only its own id; siblings stay off.
    const withOptIn = resolveBundledExtensionToggles({ extensions: { "context-mode": true } });
    expect(withOptIn["context-mode"]).toBe(true);
    for (const id of BUNDLED_EXTENSION_IDS) {
      if (id === "context-mode") continue;
      expect(withOptIn[id], `${id} unaffected by sibling opt-in`).toBe(false);
    }
  });
});

describe("resolveGraphSettings", () => {
  it("defaults graph settings to warn-on and honors explicit disables", () => {
    expect(resolveGraphSettings({})).toEqual({
      warnOnStale: true,
      autoSuggestUpdate: true,
    });
    expect(resolveGraphSettings({ graph: { warnOnStale: false } })).toEqual({
      warnOnStale: false,
      autoSuggestUpdate: true,
    });
    expect(resolveGraphSettings({ graph: { autoSuggestUpdate: false } })).toEqual({
      warnOnStale: true,
      autoSuggestUpdate: false,
    });
  });
});

describe("resolveDefaults", () => {
  it("defaults persona, trims language, and passes supported personas through", () => {
    expect(resolveDefaults({})).toEqual({ persona: "neutral" });
    expect(resolveDefaults({ defaults: { language: "  ja  ", persona: "neutral" } })).toEqual({
      language: "ja",
      persona: "neutral",
    });
    for (const persona of ["gentleman", "gyal", "raiden"] as const) {
      expect(resolveDefaults({ defaults: { persona } })).toEqual({ persona });
    }
  });
});

describe("resolveProjectTrust", () => {
  it("resolves trust settings with fallbacks for invalid values", () => {
    expect(resolveProjectTrust({})).toEqual({ mode: "delegate", remember: false });
    expect(resolveProjectTrust({ projectTrust: { mode: "always", remember: true } })).toEqual({
      mode: "always",
      remember: true,
    });
    expect(
      resolveProjectTrust({
        projectTrust: {
          // SAFETY: test fixture injects an invalid value to prove fallback.
          mode: "bogus" as never,
          remember: true,
        },
      }),
    ).toEqual({ mode: "delegate", remember: true });
    expect(
      resolveProjectTrust({
        projectTrust: {
          mode: "prompt",
          // SAFETY: test fixture injects an invalid value to prove fallback.
          remember: "yes" as never,
        },
      }),
    ).toEqual({ mode: "prompt", remember: false });
  });
});

describe("resolveHotmilkConfigRoot", () => {
  it("resolves the config root through the explicit > HOTMILK_CONFIG_ROOT > PI_CODING_AGENT_DIR chain", async () => {
    const explicit = tempConfigDir();
    const hotmilkRoot = tempConfigDir();
    const agentDir = tempConfigDir();

    const explicitResolved = await withConfigEnv(tempConfigDir(), tempConfigDir(), () =>
      resolveHotmilkConfigRoot(explicit),
    );
    expect(explicitResolved).toBe(explicit);

    const envResolved = await withConfigEnv(hotmilkRoot, agentDir, () =>
      resolveHotmilkConfigRoot(),
    );
    expect(envResolved).toBe(hotmilkRoot);

    await withConfigEnv(undefined, agentDir, () => {
      expect(resolveHotmilkConfigRoot()).toBe(agentDir);
      expect(hotmilkConfigDisplayPath()).toBe(getHotmilkConfigPath());
    });

    // With no env at all, the display path is home-relative.
    await withConfigEnv(undefined, undefined, () => {
      expect(hotmilkConfigDisplayPath()).toBe("~/.pi/agent/hotmilk.json");
    });
  });
});

describe("tildePath", () => {
  it("abbreviates paths under home (any harness agent dir) and leaves others absolute", () => {
    expect(tildePath("/home/u/.omp/profiles/work/agent/hotmilk.json", "/home/u")).toBe(
      "~/.omp/profiles/work/agent/hotmilk.json",
    );
    expect(tildePath("/home/u", "/home/u")).toBe("~");
    expect(tildePath("/home/user2/x", "/home/u")).toBe("/home/user2/x");
    expect(tildePath("/tmp/agent/hotmilk.json", "/home/u")).toBe("/tmp/agent/hotmilk.json");
  });
});

describe("seedHotmilkConfigIfMissing", () => {
  it("seeds the default config only when hotmilk.json is missing", () => {
    const configRoot = tempConfigDir();

    const seeded = seedHotmilkConfigIfMissing(configRoot);
    expect(seeded.seeded).toBe(true);
    expect(parseJsonValue(readFileSync(getHotmilkConfigPath(configRoot), "utf8"))).toEqual(
      DEFAULT_HOTMILK_CONFIG,
    );

    const configPath = getHotmilkConfigPath(tempConfigDir());
    writeFileSync(configPath, '{"extensions":{"ask-user":false}}', "utf8");
    const preserved = seedHotmilkConfigIfMissing(dirname(configPath));
    expect(preserved.seeded).toBe(false);
    expect(parseJsonValue(readFileSync(configPath, "utf8"))).toEqual({
      extensions: { "ask-user": false },
    });
  });
});

describe("loadHotmilkConfig", () => {
  it("loads the file, falls back to defaults, and never writes", async () => {
    const withFile = tempConfigDir();
    writeFileSync(
      getHotmilkConfigPath(withFile),
      '{"extensions":{"context-mode":false}}',
      "utf8",
    );
    const loaded = loadHotmilkConfig(withFile);
    expect(loaded.config.extensions?.["context-mode"]).toBe(false);
    expect(loaded.path).toBe(getHotmilkConfigPath(withFile));

    // Ids of retired registry rows are dropped on load, never resolved or re-saved.
    const retired = tempConfigDir();
    writeFileSync(
      getHotmilkConfigPath(retired),
      '{"extensions":{"openspec-context":true,"btw":false}}',
      "utf8",
    );
    expect(loadHotmilkConfig(retired).config.extensions).toEqual({ btw: false });

    const malformed = tempConfigDir();
    writeFileSync(getHotmilkConfigPath(malformed), "{not json", "utf8");
    const failed = loadHotmilkConfig(malformed);
    expect(failed.config).toEqual(DEFAULT_HOTMILK_CONFIG);
    expect(failed.error).toEqual(expect.any(String));

    const missing = tempConfigDir();
    const empty = loadHotmilkConfig(missing);
    expect(empty.config.extensions).toEqual(DEFAULT_HOTMILK_CONFIG.extensions);
    expect(existsSync(getHotmilkConfigPath(missing))).toBe(false);
  });
});

describe("0.2.0 default-off notice state", () => {
  it("lost = formerly default-on rows without a saved value; nothing once the notice is recorded", () => {
    expect(legacyDefaultsLost({})).toEqual([...PRE_0_2_DEFAULT_ON_IDS]);
    // A saved value, whichever way it points, is a decision: only the unsaved rows are lost.
    expect(legacyDefaultsLost({ extensions: { btw: false, ponytail: true } })).toEqual(
      PRE_0_2_DEFAULT_ON_IDS.filter((id) => id !== "btw" && id !== "ponytail"),
    );
    // Explicit `false` is a saved decision, not a loss.
    const decided = Object.fromEntries(PRE_0_2_DEFAULT_ON_IDS.map((id) => [id, false]));
    expect(legacyDefaultsLost({ extensions: decided })).toEqual([]);
    expect(legacyDefaultsLost({ notices: { defaultOff020: true } })).toEqual([]);
    // A fresh install is seeded with every value explicit, so it never sees the notice.
    expect(legacyDefaultsLost(DEFAULT_HOTMILK_CONFIG)).toEqual([]);
  });

  it("records the marker through load/save, and never overwrites a config that failed to parse", () => {
    const root = tempConfigDir();
    writeFileSync(getHotmilkConfigPath(root), '{"extensions":{"btw":true},"defaults":{"persona":"gyal"}}', "utf8");
    expect(markDefaultOffNoticeSeen(root).error).toBeUndefined();
    const loaded = loadHotmilkConfig(root).config;
    expect(loaded).toMatchObject({
      extensions: { btw: true },
      defaults: { persona: "gyal" },
      notices: { defaultOff020: true },
    });

    const broken = tempConfigDir();
    writeFileSync(getHotmilkConfigPath(broken), "{not json", "utf8");
    expect(markDefaultOffNoticeSeen(broken).error).toEqual(expect.any(String));
    expect(readFileSync(getHotmilkConfigPath(broken), "utf8")).toBe("{not json");
  });
});

describe("createHotmilkRuntime harness", () => {
  it("keeps bundled toggles under pi and, under omp, keeps only rows flagged omp", () => {
    const root = tempConfigDir();
    const allOn = Object.fromEntries(BUNDLED_EXTENSION_IDS.map((id) => [id, true]));
    writeFileSync(getHotmilkConfigPath(root), JSON.stringify({ extensions: allOn }), "utf8");
    // Installed Pi package reports `.pi`, so detection resolves to pi.
    expect(createHotmilkRuntime(root).harness).toBe("pi");

    const pi = createHotmilkRuntime(root, "pi");
    expect(Object.values(pi.extensionToggles).every(Boolean)).toBe(true);
    expect(pi.harnessSkips).toEqual([]);

    const restore = setEnv("HOTMILK_OMP_UNGATED", "0"); // a leaked audit knob must not change this case
    const omp = createHotmilkRuntime(root, "omp");
    restore();
    expect(omp.harness).toBe("omp");
    expect(OMP_SUPPORTED_IDS.length).toBeGreaterThan(0);
    for (const id of BUNDLED_EXTENSION_IDS) {
      expect(omp.extensionToggles[id], id).toBe(OMP_SUPPORTED_IDS.includes(id));
    }
    expect(omp.harnessSkips).toEqual(
      BUNDLED_EXTENSION_IDS.filter((id) => !OMP_SUPPORTED_IDS.includes(id)),
    );
  });

  it("under omp, the audit knob (UNGATED + OMP_AUDIT_TOOLS) loads every enabled row; skips list only enabled rows", () => {
    const root = tempConfigDir();
    const piOnly = BUNDLED_EXTENSION_IDS.find((id) => !OMP_SUPPORTED_IDS.includes(id));
    if (piOnly === undefined) throw new Error("registry has no pi-only row to test with");
    writeFileSync(
      getHotmilkConfigPath(root),
      JSON.stringify({ extensions: { [piOnly]: true } }),
      "utf8",
    );

    // A stray UNGATED without the audit marker must not lift the gate.
    const restoreStray = setEnv("HOTMILK_OMP_UNGATED", "1");
    const stray = createHotmilkRuntime(root, "omp");
    restoreStray();
    expect(stray.harnessSkips).toEqual([piOnly]);

    const restoreAudit = setEnv("OMP_AUDIT_TOOLS", "/tmp/tools.json");
    const restore = setEnv("HOTMILK_OMP_UNGATED", "1");
    const ungated = createHotmilkRuntime(root, "omp");
    restore();
    restoreAudit();
    expect(ungated.extensionToggles[piOnly]).toBe(true);
    expect(ungated.harnessSkips).toEqual([]);

    // Gated: only the enabled pi-only row is reported, not every unflagged id.
    const restoreOff = setEnv("HOTMILK_OMP_UNGATED", "0");
    const gated = createHotmilkRuntime(root, "omp");
    restoreOff();
    expect(gated.harnessSkips).toEqual([piOnly]);
  });
});
