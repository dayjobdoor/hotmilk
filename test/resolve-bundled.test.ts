import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vite-plus/test";
import { parseBundledModulePath, resolveBundledModule } from "../src/bootstrap/resolve-bundled.ts";
import { makeTempDir } from "./fixtures/tmp.ts";

describe("parseBundledModulePath", () => {
  it("parses supported bundled module path shapes", () => {
    const cases = [
      [
        "@haispeed/pi-obsidian/extensions/obsidian-cli.ts",
        { pkgName: "@haispeed/pi-obsidian", subpath: "extensions/obsidian-cli.ts" },
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
  it("resolves nested node_modules in dev layout", () => {
    const tempDir = makeTempDir("hotmilk-resolve-nested-");
    const hotmilkRoot = join(tempDir, "node_modules", "hotmilk");
    const bootstrapDir = join(hotmilkRoot, "src", "bootstrap");
    const modulePath = "context-mode/build/adapters/pi/extension.js";
    const nestedFile = join(hotmilkRoot, "node_modules", modulePath);

    mkdirSync(bootstrapDir, { recursive: true });
    mkdirSync(dirname(nestedFile), { recursive: true });
    writeFileSync(join(hotmilkRoot, "package.json"), JSON.stringify({ name: "hotmilk" }));
    writeFileSync(join(bootstrapDir, "extensions.ts"), "");
    writeFileSync(nestedFile, "");

    const resolved = resolveBundledModule(
      modulePath,
      pathToFileURL(join(bootstrapDir, "extensions.ts")).href,
    );

    expect(resolved).toBe(nestedFile);
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
