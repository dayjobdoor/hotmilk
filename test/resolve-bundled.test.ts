import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vite-plus/test";
import {
  bundledImportUrl,
  parseBundledModulePath,
  resolveBundledModule,
} from "../src/bootstrap/resolve-bundled.ts";
import { makeTempDir } from "./fixtures/tmp.ts";

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

  it("parses the pi-btw extension path like other package modules", () => {
    expect(parseBundledModulePath("pi-btw/extensions/btw.ts")).toEqual({
      pkgName: "pi-btw",
      subpath: "extensions/btw.ts",
    });
  });
});

describe("resolveBundledModule", () => {
  it("resolves pi-btw from node_modules", () => {
    const resolved = resolveBundledModule("pi-btw/extensions/btw.ts", import.meta.url);
    expect(resolved).toMatch(/node_modules[/\\]pi-btw[/\\]extensions[/\\]btw\.ts$/);
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
    const tempDir = makeTempDir("hotmilk-resolve-bundled-");

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
