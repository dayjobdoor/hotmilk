/**
 * Resolution helpers for bundled extension modules.
 *
 * Bundled deps may be nested under hotmilk or hoisted next to it; these helpers
 * walk the package tree to find them without depending on npm internals.
 */

import { existsSync, readFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { isJsonObject, isJsonString, parseJsonValue } from "../json.ts";

const HOTMILK_MODULE_PREFIX = "hotmilk/";
export type BundledModulePath = { pkgName: string; subpath: string };

function findHotmilkPackageRoot(fromModuleUrl: string): string {
  let dir = dirname(fileURLToPath(fromModuleUrl));

  while (true) {
    const pkgJsonPath = join(dir, "package.json");
    if (existsSync(pkgJsonPath)) {
      try {
        const pkg = parseJsonValue(readFileSync(pkgJsonPath, "utf8"));
        if (isJsonObject(pkg) && isJsonString(pkg.name) && pkg.name === "hotmilk") {
          return dir;
        }
      } catch {
        // ignore invalid package.json while walking up
      }
    }

    const parent = dirname(dir);
    if (parent === dir) {
      break;
    }
    dir = parent;
  }

  throw new Error("Cannot locate hotmilk package root");
}

/**
 * Split a bundled module specifier into package name and subpath.
 *
 * Supports scoped packages (`@scope/name/...`) and the `hotmilk/` prefix.
 *
 * @param relativePath - specifier like `pkg/subpath` or `@scope/pkg/subpath`
 */
export function parseBundledModulePath(relativePath: string): BundledModulePath {
  if (relativePath.startsWith(HOTMILK_MODULE_PREFIX)) {
    return {
      pkgName: "hotmilk",
      subpath: relativePath.slice(HOTMILK_MODULE_PREFIX.length),
    };
  }
  if (relativePath.startsWith("@")) {
    const parts = relativePath.split("/");
    return { pkgName: `${parts[0]}/${parts[1]}`, subpath: parts.slice(2).join("/") };
  }
  const slash = relativePath.indexOf("/");
  if (slash === -1) {
    return { pkgName: relativePath, subpath: "index.ts" };
  }
  return { pkgName: relativePath.slice(0, slash), subpath: relativePath.slice(slash + 1) };
}

/**
 * Resolve a bundled dependency file on disk.
 *
 * Handles both npm-nested (`.../hotmilk/node_modules/pkg/...`) and hoisted
 * (`.../node_modules/pkg/...`) layouts.
 *
 * @param relativePath - bundled module specifier
 * @param fromModuleUrl - module URL to start the search from (default: `import.meta.url`)
 * @returns absolute path to the resolved file
 * @throws when the module cannot be located
 */
export function resolveBundledModule(
  relativePath: string,
  fromModuleUrl = import.meta.url,
): string {
  if (relativePath.startsWith(HOTMILK_MODULE_PREFIX)) {
    const local = join(
      findHotmilkPackageRoot(fromModuleUrl),
      relativePath.slice(HOTMILK_MODULE_PREFIX.length),
    );
    if (existsSync(local)) {
      return local;
    }
  }

  const { pkgName, subpath } = parseBundledModulePath(relativePath);
  let dir = dirname(fileURLToPath(fromModuleUrl));

  while (true) {
    const nested = join(dir, "node_modules", pkgName, subpath);
    if (existsSync(nested)) {
      return nested;
    }

    if (basename(dir) === "node_modules") {
      const sibling = join(dir, pkgName, subpath);
      if (existsSync(sibling)) {
        return sibling;
      }
    }

    if (pkgName === "hotmilk") {
      const inTree = join(dir, subpath);
      if (existsSync(inTree)) {
        return inTree;
      }
    }

    const parent = dirname(dir);
    if (parent === dir) {
      break;
    }
    dir = parent;
  }

  throw new Error(`Cannot resolve bundled module "${relativePath}" from hotmilk`);
}

/**
 * Build a `file://` URL for a bundled module suitable for dynamic `import()`.
 *
 * @param relativePath - bundled module specifier
 */
export function bundledImportUrl(relativePath: string): string {
  return pathToFileURL(resolveBundledModule(relativePath)).href;
}
