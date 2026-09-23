import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { BUNDLED_EXTENSION_IDS } from "../src/config/bundled-extensions.ts";
import {
  AGENT_HOTMILK_CONFIG_LABEL,
  DEFAULT_HOTMILK_CONFIG,
  getHotmilkConfigPath,
  hotmilkConfigDisplayPath,
  loadHotmilkConfig,
  resolveBundledExtensionToggles,
  resolveDefaults,
  resolveGraphSettings,
  resolveHotmilkConfigRoot,
  resolveProjectTrust,
  seedHotmilkConfigIfMissing,
} from "../src/config/hotmilk.ts";
import { makeTempDir } from "./fixtures/tmp.ts";
import { withConfigEnv } from "./fixtures/runtime.ts";
import { parseJsonValue } from "../src/bootstrap/json.ts";

function tempConfigDir(): string {
  return makeTempDir("hotmilk-test-");
}
describe("resolveBundledExtensionToggles", () => {
  it("resolves every bundled id to its registry default and honors explicit overrides", () => {
    const toggles = resolveBundledExtensionToggles({});
    for (const id of BUNDLED_EXTENSION_IDS) {
      expect(toggles[id], `${id} must match its registry default`).toBe(
        DEFAULT_HOTMILK_CONFIG.extensions?.[id],
      );
    }
    // An explicit override flips only its own id; siblings keep their defaults.
    const withOverride = resolveBundledExtensionToggles({ extensions: { "context-mode": false } });
    expect(withOverride["context-mode"]).toBe(false);
    for (const id of BUNDLED_EXTENSION_IDS) {
      if (id === "context-mode") continue;
      expect(withOverride[id], `${id} unaffected by sibling override`).toBe(
        DEFAULT_HOTMILK_CONFIG.extensions?.[id],
      );
    }
    expect(resolveBundledExtensionToggles({ extensions: { graphify: true } }).graphify).toBe(true);
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

    // With no env at all, the display path keeps the conventional ~/.pi/agent label.
    await withConfigEnv(undefined, undefined, () => {
      expect(hotmilkConfigDisplayPath()).toBe(AGENT_HOTMILK_CONFIG_LABEL);
    });
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
