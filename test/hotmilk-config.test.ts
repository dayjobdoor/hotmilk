import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import {
  BUNDLED_EXTENSION_IDS,
  DEFAULT_HOTMILK_CONFIG,
  getHotmilkConfigPath,
  loadHotmilkConfig,
  resolveBundledExtensionToggles,
  resolveDefaults,
  resolveGraphSettings,
  resolveMcpSettings,
  resolveProjectTrust,
  seedHotmilkConfigIfMissing,
} from "../src/config/hotmilk.ts";
import { HOTMILK_JSON_TEMPLATE } from "./fixtures/manifest.ts";

function tempConfigDir(): string {
  return mkdtempSync(join(tmpdir(), "hotmilk-test-"));
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
    ["agent-dashboard", false],
    ["web-access", false],
    ["pi-flows", false],
    ["red-green", true],
    ["autoresearch", true],
    ["plannotator", true],
    ["graphify", false],
    ["subagents", false],
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
  it("defaults persona to gentleman without language", () => {
    expect(resolveDefaults({})).toEqual({ persona: "gentleman" });
  });

  it("passes through language and persona overrides", () => {
    expect(resolveDefaults({ defaults: { language: "ja", persona: "neutral" } })).toEqual({
      language: "ja",
      persona: "neutral",
    });
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
      resolveProjectTrust({ projectTrust: { mode: "bogus" as never, remember: true } }),
    ).toEqual({ mode: "delegate", remember: true });
  });

  it("falls back to default remember for non-boolean remember", () => {
    expect(
      resolveProjectTrust({ projectTrust: { mode: "prompt", remember: "yes" as never } }),
    ).toEqual({ mode: "prompt", remember: false });
  });
});

describe("bundled hotmilk.json template", () => {
  it("is the single source of truth for DEFAULT_HOTMILK_CONFIG", () => {
    expect(Object.keys(HOTMILK_JSON_TEMPLATE.extensions).sort()).toEqual(
      [...BUNDLED_EXTENSION_IDS].sort(),
    );
    for (const id of BUNDLED_EXTENSION_IDS) {
      expect(typeof HOTMILK_JSON_TEMPLATE.extensions[id]).toBe("boolean");
    }
    expect(DEFAULT_HOTMILK_CONFIG.extensions).toEqual(HOTMILK_JSON_TEMPLATE.extensions);
    expect(DEFAULT_HOTMILK_CONFIG.graph).toEqual(HOTMILK_JSON_TEMPLATE.graph);
    expect(DEFAULT_HOTMILK_CONFIG.defaults).toEqual(HOTMILK_JSON_TEMPLATE.defaults);
    expect(DEFAULT_HOTMILK_CONFIG.mcp).toEqual(HOTMILK_JSON_TEMPLATE.mcp);
    expect(DEFAULT_HOTMILK_CONFIG.projectTrust).toEqual(HOTMILK_JSON_TEMPLATE.projectTrust);
  });
});

describe("seedHotmilkConfigIfMissing", () => {
  it("creates hotmilk.json when missing", () => {
    const configRoot = tempConfigDir();

    const result = seedHotmilkConfigIfMissing(configRoot);

    expect(result.seeded).toBe(true);
    const written = JSON.parse(readFileSync(getHotmilkConfigPath(configRoot), "utf8"));
    expect(written).toEqual(HOTMILK_JSON_TEMPLATE);
  });

  it("does not overwrite an existing hotmilk.json", () => {
    const configRoot = tempConfigDir();
    const configPath = getHotmilkConfigPath(configRoot);
    writeFileSync(configPath, '{"extensions":{"ask-user":false}}', "utf8");

    const result = seedHotmilkConfigIfMissing(configRoot);

    expect(result.seeded).toBe(false);
    expect(JSON.parse(readFileSync(configPath, "utf8"))).toEqual({
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
