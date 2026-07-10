import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, describe, expect, it } from "vite-plus/test";
import {
  bundledImportUrl,
  parseBundledModulePath,
  resolveBundledModule,
} from "../src/bootstrap/resolve-bundled.ts";

let tempDir: string | undefined;

afterEach(() => {
  if (tempDir) {
    rmSync(tempDir, { recursive: true, force: true });
    tempDir = undefined;
  }
});

describe("parseBundledModulePath", () => {
  it("parses scoped package paths", () => {
    expect(parseBundledModulePath("@haispeed/pi-obsidian/extensions/obsidian-cli.ts")).toEqual({
      pkgName: "@haispeed/pi-obsidian",
      subpath: "extensions/obsidian-cli.ts",
    });
  });

  it("parses unscoped package paths", () => {
    expect(parseBundledModulePath("context-mode/build/adapters/pi/extension.js")).toEqual({
      pkgName: "context-mode",
      subpath: "build/adapters/pi/extension.js",
    });
  });

  it("parses hotmilk-owned wrapper paths", () => {
    expect(parseBundledModulePath("hotmilk/src/extensions/btw.ts")).toEqual({
      pkgName: "hotmilk",
      subpath: "src/extensions/btw.ts",
    });
  });
});

describe("resolveBundledModule", () => {
  it("resolves hotmilk wrapper modules from the package tree", () => {
    const resolved = resolveBundledModule("hotmilk/src/extensions/btw.ts", import.meta.url);
    expect(resolved).toMatch(/src[/\\]extensions[/\\]btw\.ts$/);
    expect(existsSync(resolved)).toBe(true);
  });

  it("resolves nested node_modules in dev layout", () => {
    const resolved = resolveBundledModule(
      "context-mode/build/adapters/pi/extension.js",
      import.meta.url,
    );
    expect(resolved).toContain("node_modules");
    expect(resolved).toMatch(/context-mode[/\\]build[/\\]adapters[/\\]pi[/\\]extension\.js$/);
    expect(existsSync(resolved)).toBe(true);
  });

  it("resolves hoisted sibling packages next to hotmilk", () => {
    tempDir = mkdtempSync(join(tmpdir(), "hotmilk-resolve-bundled-"));

    const hotmilkRoot = join(tempDir, "node_modules", "hotmilk");
    const bootstrapDir = join(hotmilkRoot, "src", "bootstrap");
    mkdirSync(bootstrapDir, { recursive: true });
    writeFileSync(join(hotmilkRoot, "package.json"), JSON.stringify({ name: "hotmilk" }));
    writeFileSync(join(bootstrapDir, "extensions.ts"), "");

    const modulePath = "context-mode/build/adapters/pi/extension.js";
    const siblingFile = join(tempDir, "node_modules", modulePath);
    mkdirSync(dirname(siblingFile), { recursive: true });
    writeFileSync(siblingFile, "");

    const resolved = resolveBundledModule(
      modulePath,
      pathToFileURL(join(bootstrapDir, "extensions.ts")).href,
    );
    expect(resolved).toMatch(
      /node_modules[/\\]context-mode[/\\]build[/\\]adapters[/\\]pi[/\\]extension\.js$/,
    );
    expect(existsSync(resolved)).toBe(true);
  });

  it("returns a file URL that resolves to an existing module", () => {
    const modulePath = "gentle-pi/extensions/gentle-ai.ts";
    const url = bundledImportUrl(modulePath);
    expect(url.startsWith("file://")).toBe(true);
    expect(existsSync(resolveBundledModule(modulePath, import.meta.url))).toBe(true);
  });
});
