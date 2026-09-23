import fs from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it } from "vite-plus/test";
import {
  collectInstalledPackageNamesFromPiSettings,
  detectGlobalBundledExtensionSkips,
  detectProjectHotmilkEntry,
  parseNpmPackageName,
  shouldYieldToProjectEntry,
} from "../src/bootstrap/global-extension-sources.ts";
import type { JsonObject } from "../src/bootstrap/json.ts";
import { recordingPi } from "./fixtures/recording-pi.ts";
import { makeTempDir } from "./fixtures/tmp.ts";

import { allExtensionsDisabled, setEnv } from "./fixtures/runtime.ts";

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
    tmpHome = makeTempDir("hotmilk-global-ext-");
  });

  function writeSettings(relativeDir: string, settings: JsonObject): void {
    const dir = path.join(tmpHome, relativeDir);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, "settings.json"),
      `${JSON.stringify(settings, null, 2)}\n`,
      "utf-8",
    );
  }

  it("scans global and project settings per includeProjectSettings, excluding hotmilk and non-strings", () => {
    writeSettings(".pi/agent", { packages: ["npm:hotmilk", "npm:graphify-pi", 42, null] });
    writeSettings("project/.pi", { packages: ["npm:@juicesharp/rpiv-ask-user-question"] });

    const project = path.join(tmpHome, "project");
    const globalOnly = collectInstalledPackageNamesFromPiSettings({
      homedir: tmpHome,
      cwd: project,
      includeProjectSettings: false,
    });
    // hotmilk itself and non-string entries never enter the name set.
    expect(globalOnly.has("graphify-pi")).toBe(true);
    expect(globalOnly.has("hotmilk")).toBe(false);
    expect(globalOnly.has("@juicesharp/rpiv-ask-user-question")).toBe(false);
    expect(globalOnly.size).toBe(1);

    const both = collectInstalledPackageNamesFromPiSettings({ homedir: tmpHome, cwd: project });
    expect(both.has("graphify-pi")).toBe(true);
    expect(both.has("@juicesharp/rpiv-ask-user-question")).toBe(true);
  });

  it("reads global settings from PI_CODING_AGENT_DIR when homedir is omitted", () => {
    const agentDir = makeTempDir("hotmilk-agent-dir-");
    fs.mkdirSync(agentDir, { recursive: true });
    fs.writeFileSync(
      path.join(agentDir, "settings.json"),
      `${JSON.stringify({ packages: ["npm:graphify-pi"] }, null, 2)}\n`,
      "utf-8",
    );
    const restoreAgentDir = setEnv("PI_CODING_AGENT_DIR", agentDir);
    try {
      const names = collectInstalledPackageNamesFromPiSettings({
        cwd: agentDir,
        includeProjectSettings: false,
      });
      expect(names.has("graphify-pi")).toBe(true);
    } finally {
      restoreAgentDir();
    }
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
    tmpHome = makeTempDir("hotmilk-global-skip-");
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
});

describe("registerBundledExtensions global skip", () => {
  it(
    "skips registration for a globally provided bundled extension",
    { timeout: 30_000 },
    async () => {
      const { registerBundledExtensions } = await import("../src/bootstrap/extensions.ts");

      const enabled = allExtensionsDisabled();
      enabled.graphify = true;

      const { pi, accessed } = recordingPi();
      const result = await registerBundledExtensions(pi, enabled, {
        globalSkips: [{ id: "graphify", packageName: "graphify-pi" }],
      });

      expect(result.globalSkips).toEqual([{ id: "graphify", packageName: "graphify-pi" }]);
      expect(accessed).toEqual([]);
    },
  );
});

describe("detectProjectHotmilkEntry", () => {
  function writeHotmilkCheckout(dir: string, settings?: JsonObject): void {
    fs.mkdirSync(path.join(dir, ".pi"), { recursive: true });
    fs.writeFileSync(
      path.join(dir, "package.json"),
      JSON.stringify({ name: "hotmilk", pi: { extensions: ["./src/index.ts"] } }),
      "utf-8",
    );
    if (settings) {
      fs.writeFileSync(
        path.join(dir, ".pi", "settings.json"),
        JSON.stringify(settings),
        "utf-8",
      );
    }
  }

  it("detects only checkouts whose settings reference the copy", () => {
    // Checkout with the real repo's settings shape: package root + entry dir.
    const dir = makeTempDir("hotmilk-project-entry-pkg-");
    writeHotmilkCheckout(dir, { packages: [".."], extensions: ["../src"] });
    expect(detectProjectHotmilkEntry(dir)).toBe(true);

    const cases: Array<{ label: string; settings?: JsonObject; entry?: string }> = [
      { label: "fresh clone without project settings" },
      { label: "settings referencing other packages", settings: { packages: ["npm:graphify-pi"] } },
      {
        label: "in-repo extension that is not the copy",
        settings: { extensions: ["../src/extensions/other.ts"] },
      },
      {
        label: "non-canonical extension entry",
        settings: { packages: [".."] },
        entry: "./other.ts",
      },
    ];
    for (const { label, settings, entry } of cases) {
      const rejectDir = makeTempDir("hotmilk-project-entry-reject-");
      fs.mkdirSync(path.join(rejectDir, ".pi"), { recursive: true });
      fs.writeFileSync(
        path.join(rejectDir, "package.json"),
        JSON.stringify({
          name: "hotmilk",
          pi: { extensions: [entry ?? "./src/index.ts"] },
        }),
        "utf-8",
      );
      if (settings) {
        fs.writeFileSync(
          path.join(rejectDir, ".pi", "settings.json"),
          JSON.stringify(settings),
          "utf-8",
        );
      }
      expect(detectProjectHotmilkEntry(rejectDir), label).toBe(false);
    }
    // No manifest at all.
    expect(detectProjectHotmilkEntry(makeTempDir("hotmilk-project-entry-reject-"))).toBe(false);
  });
});

describe("shouldYieldToProjectEntry", () => {
  const packageDir = path.join(makeTempDir("hotmilk-pkgdir-"), "npm");
  const globalEntryPath = path.join(packageDir, "node_modules", "hotmilk", "src", "index.ts");

  it("yields only for the npm-installed copy inside a hotmilk checkout", () => {
    // Checkout fixture mirrors the repo's settings shape; no dependence on
    // this repo's gitignored .pi/settings.json.
    const checkout = makeTempDir("hotmilk-pkgdir-checkout-");
    fs.mkdirSync(path.join(checkout, ".pi"), { recursive: true });
    fs.writeFileSync(
      path.join(checkout, "package.json"),
      JSON.stringify({ name: "hotmilk", pi: { extensions: ["./src/index.ts"] } }),
      "utf-8",
    );
    fs.writeFileSync(
      path.join(checkout, ".pi", "settings.json"),
      JSON.stringify({ packages: [".."], extensions: ["../src"] }),
      "utf-8",
    );

    expect(shouldYieldToProjectEntry(globalEntryPath, checkout, { packageDir })).toBe(true);
    expect(
      shouldYieldToProjectEntry(path.join(checkout, "src", "index.ts"), checkout, { packageDir }),
    ).toBe(false);
    expect(
      shouldYieldToProjectEntry(globalEntryPath, makeTempDir("hotmilk-normal-project-"), {
        packageDir,
      }),
    ).toBe(false);
  });
});
