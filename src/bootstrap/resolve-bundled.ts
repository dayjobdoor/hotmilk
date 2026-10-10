/**
 * Resolution helpers for bundled extension modules.
 *
 * Bundled deps may be nested under hotmilk or hoisted next to it; these helpers
 * walk the package tree to find them without depending on npm internals.
 */

import { existsSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/** Split `pkg/subpath` or `@scope/pkg/subpath`; a bare name resolves to `index.ts`. */
function parseBundledModulePath(relativePath: string) {
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
