import { existsSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/** Split `pkg/subpath` — supports scoped packages (`@scope/name/...`). */
export function parseBundledModulePath(relativePath: string): { pkgName: string; subpath: string } {
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

/** Dynamic import URL for a bundled extension entry (works with nested and hoisted installs). */
export function bundledImportUrl(relativePath: string): string {
  return pathToFileURL(resolveBundledModule(relativePath)).href;
}
