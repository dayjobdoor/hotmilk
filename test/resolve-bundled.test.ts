import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vite-plus/test";
import { parseBundledModulePath, resolveBundledModule } from "../src/bootstrap/resolve-bundled.ts";
import { makeTempDir } from "./fixtures/tmp.ts";

describe("parseBundledModulePath", () => {
  it("parses supported bundled module path formats", () => {
    const cases = [
      [
        "@runecraft/graphify-pi/extensions/index.ts",
        { pkgName: "@runecraft/graphify-pi", subpath: "extensions/index.ts" },
      ],
      [
        "context-mode/build/adapters/pi/extension.js",
        { pkgName: "context-mode", subpath: "build/adapters/pi/extension.js" },
      ],
      ["gentle-pi", { pkgName: "gentle-pi", subpath: "index.ts" }],
      ["hotmilk/src/index.ts", { pkgName: "hotmilk", subpath: "src/index.ts" }],
    ] as const;

    for (const [input, expected] of cases) {
      expect(parseBundledModulePath(input)).toEqual(expected);
    }
  });
});

describe("resolveBundledModule", () => {
  it("resolves bundled modules from nested and hoisted node_modules layouts", () => {
    const modulePath = "context-mode/build/adapters/pi/extension.js";

    const nestedDir = makeTempDir("hotmilk-resolve-nested-");
    const nestedHotmilkRoot = join(nestedDir, "node_modules", "hotmilk");
    const nestedBootstrapDir = join(nestedHotmilkRoot, "src", "bootstrap");
    const nestedFile = join(nestedHotmilkRoot, "node_modules", modulePath);
    mkdirSync(nestedBootstrapDir, { recursive: true });
    mkdirSync(dirname(nestedFile), { recursive: true });
    writeFileSync(join(nestedHotmilkRoot, "package.json"), JSON.stringify({ name: "hotmilk" }));
    writeFileSync(join(nestedBootstrapDir, "extensions.ts"), "");
    writeFileSync(nestedFile, "");
    const nestedResolved = resolveBundledModule(
      modulePath,
      pathToFileURL(join(nestedBootstrapDir, "extensions.ts")).href,
    );
    expect(nestedResolved).toBe(nestedFile);
    expect(existsSync(nestedResolved)).toBe(true);

    const hoistedDir = makeTempDir("hotmilk-resolve-bundled-");
    const hoistedHotmilkRoot = join(hoistedDir, "node_modules", "hotmilk");
    const hoistedBootstrapDir = join(hoistedHotmilkRoot, "src", "bootstrap");
    mkdirSync(hoistedBootstrapDir, { recursive: true });
    writeFileSync(join(hoistedHotmilkRoot, "package.json"), JSON.stringify({ name: "hotmilk" }));
    writeFileSync(join(hoistedBootstrapDir, "extensions.ts"), "");
    const siblingFile = join(hoistedDir, "node_modules", modulePath);
    mkdirSync(dirname(siblingFile), { recursive: true });
    writeFileSync(siblingFile, "");
    const hoistedResolved = resolveBundledModule(
      modulePath,
      pathToFileURL(join(hoistedBootstrapDir, "extensions.ts")).href,
    );
    expect(hoistedResolved).toMatch(
      /node_modules[/\\]context-mode[/\\]build[/\\]adapters[/\\]pi[/\\]extension\.js$/,
    );
    expect(existsSync(hoistedResolved)).toBe(true);
  });

  it("throws when a bundled module cannot be resolved", () => {
    const tempDir = makeTempDir("hotmilk-resolve-missing-");
    const fromModule = join(tempDir, "src", "bootstrap", "extensions.ts");
    mkdirSync(join(tempDir, "src", "bootstrap"), { recursive: true });
    writeFileSync(fromModule, "");

    expect(() =>
      resolveBundledModule("missing-package/extension.js", pathToFileURL(fromModule).href),
    ).toThrow('Cannot resolve bundled module "missing-package/extension.js" from hotmilk');
  });
});
