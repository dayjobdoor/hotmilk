import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { describe, expect, it } from "vite-plus/test";
import {
  AGENT_HOTMILK_CONFIG_LABEL,
  BUNDLED_EXTENSION_IDS,
  DEFAULT_HOTMILK_CONFIG,
  getHotmilkConfigPath,
  hotmilkConfigDisplayPath,
  loadHotmilkConfig,
  resolveHotmilkConfigRoot,
  seedHotmilkConfigIfMissing,
} from "../src/config/hotmilk.ts";
import {
  resolveBundledExtensionToggles,
  resolveDefaults,
  resolveGraphSettings,
  resolveProjectTrust,
} from "../src/config/resolve.ts";
import { makeTempDir } from "./fixtures/tmp.ts";
import { parseJsonValue } from "../src/bootstrap/json.ts";

function tempConfigDir(): string {
  return makeTempDir("hotmilk-test-");
}

function withConfigEnv<T>(
  hotmilkRoot: string | undefined,
  piRoot: string | undefined,
  callback: () => T,
): T {
  const previousHotmilk = process.env.HOTMILK_CONFIG_ROOT;
  const previousPi = process.env.PI_CODING_AGENT_DIR;
  if (hotmilkRoot === undefined) delete process.env.HOTMILK_CONFIG_ROOT;
  else process.env.HOTMILK_CONFIG_ROOT = hotmilkRoot;
  if (piRoot === undefined) delete process.env.PI_CODING_AGENT_DIR;
  else process.env.PI_CODING_AGENT_DIR = piRoot;
  try {
    return callback();
  } finally {
    if (previousHotmilk === undefined) delete process.env.HOTMILK_CONFIG_ROOT;
    else process.env.HOTMILK_CONFIG_ROOT = previousHotmilk;
    if (previousPi === undefined) delete process.env.PI_CODING_AGENT_DIR;
    else process.env.PI_CODING_AGENT_DIR = previousPi;
  }
}
describe("resolveBundledExtensionToggles", () => {
  it("falls back to registry defaults for every bundled id", () => {
    const toggles = resolveBundledExtensionToggles({
      extensions: { "ask-user": false },
    });

    for (const id of BUNDLED_EXTENSION_IDS) {
      const expected = id === "ask-user" ? false : DEFAULT_HOTMILK_CONFIG.extensions[id];
      expect(toggles[id]).toBe(expected);
    }
  });

  it("honors explicit override values for every bundled id", () => {
    for (const value of [true, false] as const) {
      for (const id of BUNDLED_EXTENSION_IDS) {
        const toggles = resolveBundledExtensionToggles({ extensions: { [id]: value } });
        expect(toggles[id]).toBe(value);
      }
    }
  });
});

describe("resolveGraphSettings", () => {
  it("defaults warnOnStale and autoSuggestUpdate to true", () => {
    expect(resolveGraphSettings({})).toEqual({
      warnOnStale: true,
      autoSuggestUpdate: true,
    });
  });

  it("allows disabling stale warnings", () => {
    expect(resolveGraphSettings({ graph: { warnOnStale: false } })).toEqual({
      warnOnStale: false,
      autoSuggestUpdate: true,
    });
  });

  it("allows disabling auto-suggest update", () => {
    expect(resolveGraphSettings({ graph: { autoSuggestUpdate: false } })).toEqual({
      warnOnStale: true,
      autoSuggestUpdate: false,
    });
  });
});

describe("resolveDefaults", () => {
  it("defaults persona to neutral without language", () => {
    expect(resolveDefaults({})).toEqual({ persona: "neutral" });
  });

  it("trims language overrides", () => {
    expect(resolveDefaults({ defaults: { language: "  ja  ", persona: "neutral" } })).toEqual({
      language: "ja",
      persona: "neutral",
    });
  });

  it("keeps every supported persona at runtime", () => {
    for (const persona of ["gentleman", "gyal", "raiden"] as const) {
      expect(resolveDefaults({ defaults: { persona } })).toEqual({ persona });
    }
  });
});

describe("resolveProjectTrust", () => {
  it("defaults to delegate without remember", () => {
    expect(resolveProjectTrust({})).toEqual({ mode: "delegate", remember: false });
  });

  it("honors explicit projectTrust settings", () => {
    expect(resolveProjectTrust({ projectTrust: { mode: "always", remember: true } })).toEqual({
      mode: "always",
      remember: true,
    });
  });

  it("falls back to delegate for invalid projectTrust mode", () => {
    expect(
      resolveProjectTrust({
        projectTrust: {
          // SAFETY: test fixture injects an invalid value to prove fallback.
          mode: "bogus" as never,
          remember: true,
        },
      }),
    ).toEqual({ mode: "delegate", remember: true });
  });

  it("falls back to default remember for non-boolean remember", () => {
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
  it("uses an explicit configRoot over env vars", () => {
    const explicit = tempConfigDir();
    expect(
      withConfigEnv(tempConfigDir(), tempConfigDir(), () => resolveHotmilkConfigRoot(explicit)),
    ).toBe(explicit);
  });

  it("prefers HOTMILK_CONFIG_ROOT over PI_CODING_AGENT_DIR", () => {
    const hotmilkRoot = tempConfigDir();
    expect(withConfigEnv(hotmilkRoot, tempConfigDir(), () => resolveHotmilkConfigRoot())).toBe(
      hotmilkRoot,
    );
  });

  it("uses PI_CODING_AGENT_DIR when HOTMILK_CONFIG_ROOT is unset", () => {
    const agentDir = tempConfigDir();
    withConfigEnv(undefined, agentDir, () => {
      expect(resolveHotmilkConfigRoot()).toBe(agentDir);
      expect(hotmilkConfigDisplayPath()).toBe(getHotmilkConfigPath());
    });
  });

  it("keeps the conventional label for the default agent path", () => {
    expect(withConfigEnv(undefined, undefined, () => hotmilkConfigDisplayPath())).toBe(
      AGENT_HOTMILK_CONFIG_LABEL,
    );
  });
});
describe("seedHotmilkConfigIfMissing", () => {
  it("creates hotmilk.json when missing", () => {
    const configRoot = tempConfigDir();

    const result = seedHotmilkConfigIfMissing(configRoot);

    expect(result.seeded).toBe(true);
    const written = parseJsonValue(readFileSync(getHotmilkConfigPath(configRoot), "utf8"));
    expect(written).toEqual(DEFAULT_HOTMILK_CONFIG);
  });

  it("does not overwrite an existing hotmilk.json", () => {
    const configRoot = tempConfigDir();
    const configPath = getHotmilkConfigPath(configRoot);
    writeFileSync(configPath, '{"extensions":{"ask-user":false}}', "utf8");

    const result = seedHotmilkConfigIfMissing(configRoot);

    expect(result.seeded).toBe(false);
    expect(parseJsonValue(readFileSync(configPath, "utf8"))).toEqual({
      extensions: { "ask-user": false },
    });
  });
});

describe("loadHotmilkConfig", () => {
  it("reads hotmilk.json when present", () => {
    const configRoot = tempConfigDir();
    writeFileSync(
      getHotmilkConfigPath(configRoot),
      '{"extensions":{"context-mode":false}}',
      "utf8",
    );

    const loaded = loadHotmilkConfig(configRoot);

    expect(loaded.config.extensions?.["context-mode"]).toBe(false);
    expect(loaded.path).toBe(getHotmilkConfigPath(configRoot));
  });

  it("falls back to defaults and reports malformed JSON", () => {
    const configRoot = tempConfigDir();
    writeFileSync(getHotmilkConfigPath(configRoot), "{not json", "utf8");

    const loaded = loadHotmilkConfig(configRoot);

    expect(loaded.config).toEqual(DEFAULT_HOTMILK_CONFIG);
    expect(loaded.path).toBe(getHotmilkConfigPath(configRoot));
    expect(loaded.error).toEqual(expect.any(String));
  });

  it("uses in-memory defaults when no config file exists", () => {
    const configRoot = tempConfigDir();

    const loaded = loadHotmilkConfig(configRoot);

    expect(loaded.config.extensions).toEqual(DEFAULT_HOTMILK_CONFIG.extensions);
    expect(existsSync(getHotmilkConfigPath(configRoot))).toBe(false);
  });
});
