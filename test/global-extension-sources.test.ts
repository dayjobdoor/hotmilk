import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vite-plus/test";
import {
  collectInstalledPackageNamesFromPiSettings,
  detectGlobalBundledExtensionSkips,
  parseNpmPackageName,
} from "../src/bootstrap/global-extension-sources.ts";

describe("parseNpmPackageName", () => {
  it("parses scoped and unscoped npm specs", () => {
    expect(parseNpmPackageName("npm:graphify-pi")).toBe("graphify-pi");
    expect(parseNpmPackageName("npm:graphify-pi@^0.1.0")).toBe("graphify-pi");
    expect(parseNpmPackageName("npm:@scope/pkg@1.2.3")).toBe("@scope/pkg");
  });
});

describe("collectInstalledPackageNamesFromPiSettings", () => {
  let tmpHome: string;

  beforeEach(() => {
    tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), "hotmilk-global-ext-"));
  });

  afterEach(() => {
    fs.rmSync(tmpHome, { recursive: true, force: true });
  });

  function writeSettings(relativeDir: string, settings: Record<string, unknown>): void {
    const dir = path.join(tmpHome, relativeDir);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, "settings.json"),
      `${JSON.stringify(settings, null, 2)}\n`,
      "utf-8",
    );
  }

  it("ignores project settings when includeProjectSettings is false", () => {
    writeSettings(".pi/agent", { packages: ["npm:graphify-pi"] });
    writeSettings("project/.pi", { packages: ["npm:pi-ask-user"] });

    const names = collectInstalledPackageNamesFromPiSettings({
      homedir: tmpHome,
      cwd: path.join(tmpHome, "project"),
      includeProjectSettings: false,
    });

    expect(names.has("graphify-pi")).toBe(true);
    expect(names.has("pi-ask-user")).toBe(false);
  });

  it("collects npm package names from global and project settings", () => {
    writeSettings(".pi/agent", { packages: ["npm:hotmilk", "npm:graphify-pi"] });
    writeSettings("project/.pi", { packages: ["npm:pi-ask-user"] });

    const names = collectInstalledPackageNamesFromPiSettings({
      homedir: tmpHome,
      cwd: path.join(tmpHome, "project"),
    });

    expect(names.has("hotmilk")).toBe(false);
    expect(names.has("graphify-pi")).toBe(true);
    expect(names.has("pi-ask-user")).toBe(true);
  });

  it("ignores non-string settings entries", () => {
    writeSettings(".pi/agent", { packages: ["npm:graphify-pi", 42, null] });

    const names = collectInstalledPackageNamesFromPiSettings({ homedir: tmpHome, cwd: tmpHome });
    expect(names.has("graphify-pi")).toBe(true);
    expect(names.size).toBe(1);
  });

  it("resolves local package paths via package.json name", () => {
    const graphifyRoot = path.join(tmpHome, "vendor", "graphify-pi");
    fs.mkdirSync(path.join(graphifyRoot, "extensions"), { recursive: true });
    fs.writeFileSync(
      path.join(graphifyRoot, "package.json"),
      JSON.stringify({ name: "graphify-pi" }),
      "utf-8",
    );
    fs.writeFileSync(
      path.join(graphifyRoot, "extensions", "graphify.ts"),
      "export default {};\n",
      "utf-8",
    );

    writeSettings(".pi/agent", {
      extensions: [path.join(graphifyRoot, "extensions", "graphify.ts")],
    });

    const names = collectInstalledPackageNamesFromPiSettings({ homedir: tmpHome, cwd: tmpHome });
    expect(names.has("graphify-pi")).toBe(true);
  });
});

describe("detectGlobalBundledExtensionSkips", () => {
  let tmpHome: string;

  beforeEach(() => {
    tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), "hotmilk-global-skip-"));
  });

  afterEach(() => {
    fs.rmSync(tmpHome, { recursive: true, force: true });
  });

  it("maps global gentle-pi to all gentle-pi bundled ids", () => {
    const dir = path.join(tmpHome, ".pi", "agent");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, "settings.json"),
      `${JSON.stringify({ packages: ["npm:hotmilk", "npm:gentle-pi"] }, null, 2)}\n`,
      "utf-8",
    );

    const skips = detectGlobalBundledExtensionSkips({ homedir: tmpHome, cwd: tmpHome });
    const skippedIds = new Set(skips.map((skip) => skip.id));

    expect(skippedIds.has("skill-registry")).toBe(true);
    expect(skippedIds.has("sdd-init")).toBe(true);
    expect(skippedIds.has("gentle-ai")).toBe(true);
    expect(skippedIds.has("graphify")).toBe(false);
  });

  it("ignores project-only bundled packages when includeProjectSettings is false", () => {
    const projectDir = path.join(tmpHome, "project");
    fs.mkdirSync(path.join(tmpHome, ".pi", "agent"), { recursive: true });
    fs.writeFileSync(
      path.join(tmpHome, ".pi", "agent", "settings.json"),
      `${JSON.stringify({ packages: ["npm:hotmilk"] }, null, 2)}\n`,
      "utf-8",
    );
    fs.mkdirSync(path.join(projectDir, ".pi"), { recursive: true });
    fs.writeFileSync(
      path.join(projectDir, ".pi", "settings.json"),
      `${JSON.stringify({ packages: ["npm:graphify-pi"] }, null, 2)}\n`,
      "utf-8",
    );

    const skips = detectGlobalBundledExtensionSkips({
      homedir: tmpHome,
      cwd: projectDir,
      includeProjectSettings: false,
    });

    expect(skips.some((skip) => skip.id === "graphify")).toBe(false);
  });
});

describe("registerBundledExtensions global skip", () => {
  it("does not import skipped bundled extensions", { timeout: 30_000 }, async () => {
    const { registerBundledExtensions } = await import("../src/bootstrap/extensions.ts");
    const { BUNDLED_EXTENSION_IDS } = await import("../src/config/hotmilk.ts");

    const enabled = Object.fromEntries(BUNDLED_EXTENSION_IDS.map((id) => [id, false])) as Record<
      (typeof BUNDLED_EXTENSION_IDS)[number],
      boolean
    >;
    enabled.graphify = true;

    const result = await registerBundledExtensions({} as never, enabled, {
      globalSkips: [{ id: "graphify", packageName: "graphify-pi" }],
    });

    expect(result.globalSkips).toEqual([{ id: "graphify", packageName: "graphify-pi" }]);
  });
});
