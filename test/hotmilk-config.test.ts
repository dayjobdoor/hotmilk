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
  seedHotmilkConfigIfMissing,
} from "../src/config/hotmilk.ts";

const BUNDLED_TEMPLATE = JSON.parse(
  readFileSync(join(import.meta.dirname, "../hotmilk.json"), "utf8"),
) as {
  extensions: Record<string, boolean>;
  graph: { warnOnStale: boolean; autoSuggestUpdate: boolean };
  defaults: { persona: string };
  mcp: { seedOnStart: boolean };
};

function tempConfigDir(): string {
  return mkdtempSync(join(tmpdir(), "hotmilk-test-"));
}

describe("resolveBundledExtensionToggles", () => {
  it("fills missing extension toggles with defaults", () => {
    const toggles = resolveBundledExtensionToggles({
      extensions: { "ask-user": false },
    });

    expect(toggles["ask-user"]).toBe(false);
    expect(toggles["skill-registry"]).toBe(true);
    expect(toggles.graphify).toBe(true);
    expect(toggles.subagents).toBe(true);
    expect(toggles.goal).toBe(true);
    expect(toggles["mcp-adapter"]).toBe(false);
    expect(toggles["planning-with-files"]).toBe(false);
    expect(toggles.caveman).toBe(false);
    expect(toggles["red-green"]).toBe(false);
    expect(toggles["agent-dashboard"]).toBe(false);
    expect(toggles["web-access"]).toBe(false);
    expect(toggles["pi-flows"]).toBe(false);
  });

  it("honors explicit agent-dashboard toggle", () => {
    const toggles = resolveBundledExtensionToggles({
      extensions: { "agent-dashboard": false },
    });

    expect(toggles["agent-dashboard"]).toBe(false);
  });

  it("honors explicit web-access and pi-flows toggles", () => {
    const toggles = resolveBundledExtensionToggles({
      extensions: { "web-access": false, "pi-flows": false },
    });

    expect(toggles["web-access"]).toBe(false);
    expect(toggles["pi-flows"]).toBe(false);
  });

  it("honors explicit red-green toggle", () => {
    const toggles = resolveBundledExtensionToggles({
      extensions: { "red-green": true },
    });

    expect(toggles["red-green"]).toBe(true);
  });

  it("honors explicit toggles for newly managed extensions", () => {
    const toggles = resolveBundledExtensionToggles({
      extensions: { graphify: false, subagents: false, "planning-with-files": true },
    });

    expect(toggles.graphify).toBe(false);
    expect(toggles.subagents).toBe(false);
    expect(toggles["planning-with-files"]).toBe(true);
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

  it("allows disabling MCP seed on session start", () => {
    expect(resolveMcpSettings({ mcp: { seedOnStart: false } })).toEqual({ seedOnStart: false });
  });
});

describe("bundled hotmilk.json template", () => {
  it("lists every bundled extension id", () => {
    for (const id of BUNDLED_EXTENSION_IDS) {
      expect(typeof BUNDLED_TEMPLATE.extensions[id]).toBe("boolean");
    }
  });

  it("matches DEFAULT_HOTMILK_CONFIG", () => {
    expect(DEFAULT_HOTMILK_CONFIG.extensions).toEqual(BUNDLED_TEMPLATE.extensions);
    expect(DEFAULT_HOTMILK_CONFIG.graph).toEqual(BUNDLED_TEMPLATE.graph);
    expect(DEFAULT_HOTMILK_CONFIG.defaults).toEqual(BUNDLED_TEMPLATE.defaults);
    expect(DEFAULT_HOTMILK_CONFIG.mcp).toEqual(BUNDLED_TEMPLATE.mcp);
  });
});

describe("seedHotmilkConfigIfMissing", () => {
  it("creates hotmilk.json when missing", () => {
    const configRoot = tempConfigDir();

    const result = seedHotmilkConfigIfMissing(configRoot);

    expect(result.seeded).toBe(true);
    const written = JSON.parse(readFileSync(getHotmilkConfigPath(configRoot), "utf8"));
    expect(written).toEqual(BUNDLED_TEMPLATE);
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

  it("uses defaults when no config file exists", () => {
    const configRoot = tempConfigDir();

    const loaded = loadHotmilkConfig(configRoot);

    expect(loaded.config.extensions?.["ask-user"]).toBe(true);
    expect(loaded.config.extensions?.graphify).toBe(true);
    expect(loaded.config.extensions?.["red-green"]).toBe(false);
    expect(existsSync(getHotmilkConfigPath(configRoot))).toBe(false);
  });
});
