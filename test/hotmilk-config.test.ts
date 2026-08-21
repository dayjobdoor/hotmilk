import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { describe, expect, it } from "vite-plus/test";
import {
  AGENT_HOTMILK_CONFIG_LABEL,
  BUNDLED_EXTENSION_IDS,
  DEFAULT_HOTMILK_CONFIG,
  getHotmilkConfigPath,
  hotmilkConfigDisplayPath,
  loadHotmilkConfig,
  resolveBundledExtensionToggles,
  resolveDefaults,
  resolveGraphSettings,
  resolveHotmilkConfigRoot,
  resolveMcpSettings,
  resolveProjectTrust,
  seedHotmilkConfigIfMissing,
} from "../src/config/hotmilk.ts";
import { HOTMILK_JSON_TEMPLATE } from "./fixtures/manifest.ts";
import { makeTempDir } from "./fixtures/tmp.ts";
import { parseJsonValue } from "../src/bootstrap/json.ts";

function tempConfigDir(): string {
  return makeTempDir("hotmilk-test-");
}

describe("resolveBundledExtensionToggles", () => {
  it("falls back to hotmilk.json template defaults for every bundled id", () => {
    const toggles = resolveBundledExtensionToggles({
      extensions: { "ask-user": false },
    });

    for (const id of BUNDLED_EXTENSION_IDS) {
      const expected = id === "ask-user" ? false : DEFAULT_HOTMILK_CONFIG.extensions[id];
      expect(toggles[id]).toBe(expected);
    }
  });

  it.each([
    ["red-green", true],
    ["autoresearch", true],
    ["plannotator", true],
    ["observational-memory", true],
    ["shazam", true],
    ["graphify", false],
    ["subagents", true],
    ["planning-with-files", true],
  ] as const)("honors explicit override for %s", (id, value) => {
    const toggles = resolveBundledExtensionToggles({ extensions: { [id]: value } });
    expect(toggles[id]).toBe(value);
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

  it("passes through language and persona overrides", () => {
    expect(resolveDefaults({ defaults: { language: "ja", persona: "neutral" } })).toEqual({
      language: "ja",
      persona: "neutral",
    });
  });

  it.each(["gentleman", "gyal", "raiden"] as const)("keeps %s persona at runtime", (persona) => {
    expect(resolveDefaults({ defaults: { persona } })).toEqual({ persona });
  });
});

describe("resolveMcpSettings", () => {
  it("defaults seedOnStart to false", () => {
    expect(resolveMcpSettings({})).toEqual({ seedOnStart: false });
  });

  it("allows enabling MCP seed on session start", () => {
    expect(resolveMcpSettings({ mcp: { seedOnStart: true } })).toEqual({ seedOnStart: true });
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

describe("bundled hotmilk.json template", () => {
  it("is the single source of truth for DEFAULT_HOTMILK_CONFIG", () => {
    expect(Object.keys(HOTMILK_JSON_TEMPLATE.extensions).sort()).toEqual(
      [...BUNDLED_EXTENSION_IDS].sort(),
    );
    for (const id of BUNDLED_EXTENSION_IDS) {
      expect(
        HOTMILK_JSON_TEMPLATE.extensions[id] === true ||
          HOTMILK_JSON_TEMPLATE.extensions[id] === false,
      ).toBe(true);
    }
    expect(DEFAULT_HOTMILK_CONFIG.extensions).toEqual(HOTMILK_JSON_TEMPLATE.extensions);
    expect(DEFAULT_HOTMILK_CONFIG.graph).toEqual(HOTMILK_JSON_TEMPLATE.graph);
    expect(DEFAULT_HOTMILK_CONFIG.defaults).toEqual(HOTMILK_JSON_TEMPLATE.defaults);
    expect(DEFAULT_HOTMILK_CONFIG.mcp).toEqual(HOTMILK_JSON_TEMPLATE.mcp);
    expect(DEFAULT_HOTMILK_CONFIG.projectTrust).toEqual(HOTMILK_JSON_TEMPLATE.projectTrust);
  });
});

describe("resolveHotmilkConfigRoot", () => {
  it("uses an explicit configRoot over env vars", () => {
    const explicit = tempConfigDir();
    const previousHotmilk = process.env.HOTMILK_CONFIG_ROOT;
    const previousPi = process.env.PI_CODING_AGENT_DIR;
    process.env.HOTMILK_CONFIG_ROOT = tempConfigDir();
    process.env.PI_CODING_AGENT_DIR = tempConfigDir();
    try {
      expect(resolveHotmilkConfigRoot(explicit)).toBe(explicit);
    } finally {
      if (previousHotmilk === undefined) {
        delete process.env.HOTMILK_CONFIG_ROOT;
      } else {
        process.env.HOTMILK_CONFIG_ROOT = previousHotmilk;
      }
      if (previousPi === undefined) {
        delete process.env.PI_CODING_AGENT_DIR;
      } else {
        process.env.PI_CODING_AGENT_DIR = previousPi;
      }
    }
  });

  it("prefers HOTMILK_CONFIG_ROOT over PI_CODING_AGENT_DIR", () => {
    const hotmilkRoot = tempConfigDir();
    const previousHotmilk = process.env.HOTMILK_CONFIG_ROOT;
    const previousPi = process.env.PI_CODING_AGENT_DIR;
    process.env.HOTMILK_CONFIG_ROOT = hotmilkRoot;
    process.env.PI_CODING_AGENT_DIR = tempConfigDir();
    try {
      expect(resolveHotmilkConfigRoot()).toBe(hotmilkRoot);
    } finally {
      if (previousHotmilk === undefined) {
        delete process.env.HOTMILK_CONFIG_ROOT;
      } else {
        process.env.HOTMILK_CONFIG_ROOT = previousHotmilk;
      }
      if (previousPi === undefined) {
        delete process.env.PI_CODING_AGENT_DIR;
      } else {
        process.env.PI_CODING_AGENT_DIR = previousPi;
      }
    }
  });

  it("uses PI_CODING_AGENT_DIR when HOTMILK_CONFIG_ROOT is unset", () => {
    const agentDir = tempConfigDir();
    const previousHotmilk = process.env.HOTMILK_CONFIG_ROOT;
    const previousPi = process.env.PI_CODING_AGENT_DIR;
    delete process.env.HOTMILK_CONFIG_ROOT;
    process.env.PI_CODING_AGENT_DIR = agentDir;
    try {
      expect(resolveHotmilkConfigRoot()).toBe(agentDir);
      expect(hotmilkConfigDisplayPath()).toBe(getHotmilkConfigPath());
    } finally {
      if (previousHotmilk === undefined) {
        delete process.env.HOTMILK_CONFIG_ROOT;
      } else {
        process.env.HOTMILK_CONFIG_ROOT = previousHotmilk;
      }
      if (previousPi === undefined) {
        delete process.env.PI_CODING_AGENT_DIR;
      } else {
        process.env.PI_CODING_AGENT_DIR = previousPi;
      }
    }
  });

  it("keeps the conventional label for the default agent path", () => {
    const previousHotmilk = process.env.HOTMILK_CONFIG_ROOT;
    const previousPi = process.env.PI_CODING_AGENT_DIR;
    delete process.env.HOTMILK_CONFIG_ROOT;
    delete process.env.PI_CODING_AGENT_DIR;
    try {
      expect(hotmilkConfigDisplayPath()).toBe(AGENT_HOTMILK_CONFIG_LABEL);
    } finally {
      if (previousHotmilk === undefined) {
        delete process.env.HOTMILK_CONFIG_ROOT;
      } else {
        process.env.HOTMILK_CONFIG_ROOT = previousHotmilk;
      }
      if (previousPi === undefined) {
        delete process.env.PI_CODING_AGENT_DIR;
      } else {
        process.env.PI_CODING_AGENT_DIR = previousPi;
      }
    }
  });
});
describe("seedHotmilkConfigIfMissing", () => {
  it("creates hotmilk.json when missing", () => {
    const configRoot = tempConfigDir();

    const result = seedHotmilkConfigIfMissing(configRoot);

    expect(result.seeded).toBe(true);
    const written = parseJsonValue(readFileSync(getHotmilkConfigPath(configRoot), "utf8"));
    expect(written).toEqual(HOTMILK_JSON_TEMPLATE);
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

  it("uses in-memory defaults when no config file exists", () => {
    const configRoot = tempConfigDir();

    const loaded = loadHotmilkConfig(configRoot);

    expect(loaded.config.extensions).toEqual(DEFAULT_HOTMILK_CONFIG.extensions);
    expect(existsSync(getHotmilkConfigPath(configRoot))).toBe(false);
  });
});
