import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vite-plus/test";
import {
  bundledImportUrl,
  parseBundledModulePath,
  resolveBundledModule,
} from "../src/bootstrap/resolve-bundled.ts";

describe("resolveBundledModule", () => {
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
    const hoistedBootstrap =
      "/Users/hotmilk/.local/share/chezmoi/.pi/npm/node_modules/hotmilk/src/bootstrap/extensions.ts";
    if (!existsSync(hoistedBootstrap)) {
      return;
    }

    const resolved = resolveBundledModule(
      "context-mode/build/adapters/pi/extension.js",
      pathToFileURL(hoistedBootstrap).href,
    );
    expect(resolved).toMatch(
      /node_modules[/\\]context-mode[/\\]build[/\\]adapters[/\\]pi[/\\]extension\.js$/,
    );
    expect(existsSync(resolved)).toBe(true);
  });

  it("returns a file URL suitable for dynamic import", () => {
    const url = bundledImportUrl("gentle-pi/extensions/gentle-ai.ts");
    expect(url.startsWith("file://")).toBe(true);
  });
});
