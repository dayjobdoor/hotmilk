import { existsSync } from "node:fs";
import { describe, expect, it } from "vite-plus/test";
import { resolveBundledModule } from "../src/bootstrap/resolve-bundled.ts";
import {
  BUNDLED_EXTENSION_DEFINITIONS,
  BUNDLED_EXTENSION_GROUP_ORDER,
  BUNDLED_EXTENSION_GROUPS,
  BUNDLED_EXTENSION_IDS,
  BUNDLED_EXTENSION_PACKAGES,
  CONTEXT_STACK_EXTENSION_IDS,
} from "../src/config/bundled-extensions.ts";
import {
  detectGlobalProviderForBundledExtension,
  packageNamesForBundledExtension,
} from "../src/config/bundled-package-registry.ts";
import { PACKAGE_JSON } from "./fixtures/manifest.ts";

describe("bundled extension manifest", () => {
  it("keeps ids aligned with derived tables", () => {
    expect(BUNDLED_EXTENSION_IDS).toHaveLength(BUNDLED_EXTENSION_DEFINITIONS.length);
    expect(BUNDLED_EXTENSION_DEFINITIONS.map((definition) => definition.id)).toEqual([
      ...BUNDLED_EXTENSION_IDS,
    ]);
    for (const definition of BUNDLED_EXTENSION_DEFINITIONS) {
      expect(BUNDLED_EXTENSION_PACKAGES[definition.id]).toEqual(definition.package);
    }
  });

  it("covers every id in /mode groups exactly once", () => {
    const grouped = new Set(BUNDLED_EXTENSION_GROUPS.flatMap((group) => group.ids));
    expect(grouped.size).toBe(BUNDLED_EXTENSION_IDS.length);
    for (const id of BUNDLED_EXTENSION_IDS) {
      expect(grouped.has(id)).toBe(true);
    }
  });

  it("uses only declared group labels", () => {
    const allowed = new Set<string>(BUNDLED_EXTENSION_GROUP_ORDER);
    for (const definition of BUNDLED_EXTENSION_DEFINITIONS) {
      expect(allowed.has(definition.group)).toBe(true);
    }
  });

  it("lists npm dependencies for every primary package", () => {
    const deps = new Set(Object.keys(PACKAGE_JSON.dependencies ?? {}));
    for (const definition of BUNDLED_EXTENSION_DEFINITIONS) {
      expect(deps.has(definition.package.packageName)).toBe(true);
    }
  });

  it("resolves every bundled module path on disk", () => {
    for (const definition of BUNDLED_EXTENSION_DEFINITIONS) {
      const resolved = resolveBundledModule(definition.module, import.meta.url);
      expect(existsSync(resolved), `${definition.id}: ${definition.module}`).toBe(true);
    }
  });

  it("orders context stack from loadPhase", () => {
    expect(CONTEXT_STACK_EXTENSION_IDS).toEqual(["context-mode", "rtk-optimizer"]);
  });

  it("groups context performance extensions including observational memory", () => {
    const contextPerf = BUNDLED_EXTENSION_GROUPS.find(
      (group) => group.label === "Context & performance",
    )!.ids;

    expect(contextPerf).toContain("context-mode");
    expect(contextPerf).toContain("simplify");
    expect(contextPerf).toContain("rtk-optimizer");
    expect(contextPerf).toContain("observational-memory");
    expect(contextPerf).toContain("supi-context");
  });

  it("groups agent tools including shazam and pi-actors alongside graphify", () => {
    const agentTools = BUNDLED_EXTENSION_GROUPS.find((group) => group.label === "Agent tools")!.ids;

    expect(agentTools).toContain("graphify");
    expect(agentTools).toContain("shazam");
    expect(agentTools).toContain("pi-actors");
    expect(agentTools).toContain("prompt-template-model");
    expect(agentTools.indexOf("graphify")).toBeLessThan(agentTools.indexOf("shazam"));
  });

  it("groups experiment extensions separately from workflow plan tools", () => {
    const experiments = BUNDLED_EXTENSION_GROUPS.find(
      (group) => group.label === "Experiments",
    )!.ids;
    const workflow = BUNDLED_EXTENSION_GROUPS.find((group) => group.label === "Workflow")!.ids;

    expect(experiments).toEqual(["autoresearch", "tetris"]);
    expect(workflow).toContain("plannotator");
    expect(workflow).toContain("red-green");
    expect(experiments).not.toContain("plannotator");
  });

  it("resolves global provider via aliases", () => {
    const installed = new Set(["@blackbelt-technology/pi-dashboard-extension"]);
    expect(detectGlobalProviderForBundledExtension("agent-dashboard", installed)).toBe(
      "@blackbelt-technology/pi-dashboard-extension",
    );
    expect(packageNamesForBundledExtension("agent-dashboard")).toContain(
      "@blackbelt-technology/pi-dashboard-extension",
    );
  });
});
