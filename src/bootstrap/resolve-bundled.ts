import { existsSync, readFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HOTMILK_MODULE_PREFIX = "hotmilk/";

function findHotmilkPackageRoot(fromModuleUrl: string): string {
  let dir = dirname(fileURLToPath(fromModuleUrl));

  while (true) {
    const pkgJsonPath = join(dir, "package.json");
    if (existsSync(pkgJsonPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgJsonPath, "utf8")) as { name?: string };
        if (pkg.name === "hotmilk") {
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

/** Split `pkg/subpath` — supports scoped packages (`@scope/name/...`). */
export function parseBundledModulePath(relativePath: string): { pkgName: string; subpath: string } {
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
 * Resolve a bundled dependency file whether npm nested it under hotmilk or hoisted
 * it next to hotmilk (e.g. `~/.pi/npm/node_modules/context-mode`).
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

/** Dynamic import URL for a bundled extension entry (works with nested and hoisted installs). */
export function bundledImportUrl(relativePath: string): string {
  return pathToFileURL(resolveBundledModule(relativePath)).href;
}
