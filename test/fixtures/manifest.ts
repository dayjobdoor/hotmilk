import { readFileSync } from "node:fs";
import { join } from "node:path";
import { coerce, gte, minVersion } from "semver";
import { parseJsonValue } from "../../src/json.ts";

export type HotmilkJsonTemplate = {
  extensions: Record<string, boolean>;
  graph: { warnOnStale: boolean; autoSuggestUpdate: boolean };
  defaults: { persona: string; language?: string };
  mcp: { seedOnStart: boolean };
  projectTrust: { mode: string; remember: boolean };
};

export type PackageJsonManifest = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  overrides?: Record<string, string>;
  pi?: {
    extensions?: string[];
    prompts?: string[];
    skills?: string[];
    themes?: string[];
  };
};

export type InstalledPackageJson = {
  version?: string;
  peerDependencies?: Record<string, string>;
};

/** Repo root — one level above `test/`. */
export const REPO_ROOT = join(import.meta.dirname, "../..");

/** Parsed `hotmilk.json` shipped as the user config template. */
export const HOTMILK_JSON_TEMPLATE =
  // SAFETY: we own this repo file and treat it as this named shape.
  parseJsonValue(readFileSync(join(REPO_ROOT, "hotmilk.json"), "utf8")) as HotmilkJsonTemplate;

export const PACKAGE_JSON =
  // SAFETY: we own this repo file and treat it as this named shape.
  parseJsonValue(readFileSync(join(REPO_ROOT, "package.json"), "utf8")) as PackageJsonManifest;

/** Resolve a repo-relative path from package.json `pi.*` entries. */
export function repoPath(relative: string): string {
  return join(REPO_ROOT, relative);
}

/** Read an installed dependency's package.json from the hotmilk node_modules tree. */
export function installedPackageJson(packageName: string): InstalledPackageJson {
  const pkgJsonPath = join(REPO_ROOT, "node_modules", ...packageName.split("/"), "package.json");
  return (
    // SAFETY: installed package.json is treated as this named shape.
    parseJsonValue(readFileSync(pkgJsonPath, "utf8")) as InstalledPackageJson
  );
}

export function installedPackageVersion(packageName: string): string {
  const version = installedPackageJson(packageName).version;
  if (!version) {
    throw new Error(`missing version in ${packageName}/package.json`);
  }
  return version;
}

/**
 * Floor-style semver compare: range floors (`^0.10.2`, `>=0.80.0`, `*`) resolve
 * via their minimum matching version; prerelease/build metadata on the installed
 * version is ignored (sufficient for 0.x floor checks).
 */
export function semverAtLeast(version: string, floor: string): boolean {
  return gte(coerce(version) ?? "0.0.0", minVersion(floor.trim()) ?? "0.0.0");
}
