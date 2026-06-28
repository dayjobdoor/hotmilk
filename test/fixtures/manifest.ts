import { readFileSync } from "node:fs";
import { join } from "node:path";

/** Repo root — one level above `test/`. */
export const REPO_ROOT = join(import.meta.dirname, "../..");

/** Parsed `hotmilk.json` shipped as the user config template. */
export const HOTMILK_JSON_TEMPLATE = JSON.parse(
  readFileSync(join(REPO_ROOT, "hotmilk.json"), "utf8"),
) as {
  extensions: Record<string, boolean>;
  graph: { warnOnStale: boolean; autoSuggestUpdate: boolean };
  defaults: { persona: string; language?: string };
  mcp: { seedOnStart: boolean };
  projectTrust: { mode: string; remember: boolean };
};

export const PACKAGE_JSON = JSON.parse(readFileSync(join(REPO_ROOT, "package.json"), "utf8")) as {
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  pi?: {
    extensions?: string[];
    prompts?: string[];
    skills?: string[];
    themes?: string[];
  };
};

/** Resolve a repo-relative path from package.json `pi.*` entries. */
export function repoPath(relative: string): string {
  return join(REPO_ROOT, relative);
}

/** Read an installed dependency's package.json from the hotmilk node_modules tree. */
export function installedPackageJson(packageName: string): {
  version?: string;
  peerDependencies?: Record<string, string>;
} {
  const pkgJsonPath = join(REPO_ROOT, "node_modules", ...packageName.split("/"), "package.json");
  return JSON.parse(readFileSync(pkgJsonPath, "utf8")) as {
    version?: string;
    peerDependencies?: Record<string, string>;
  };
}

export function installedPackageVersion(packageName: string): string {
  const version = installedPackageJson(packageName).version;
  if (!version) {
    throw new Error(`missing version in ${packageName}/package.json`);
  }
  return version;
}

/** Strip range operators and prerelease/build metadata; leaves `major.minor.patch`. */
export function normalizeSemver(input: string): string {
  const trimmed = input.trim();
  if (!trimmed || trimmed === "*") {
    return "0.0.0";
  }
  const withoutRange = trimmed.replace(/^[v^~=<>]+/, "");
  return withoutRange.split("-")[0]?.split("+")[0] ?? withoutRange;
}

/** Compare dotted semver tuples (no prerelease ordering — sufficient for 0.x floors). */
export function semverAtLeast(version: string, floor: string): boolean {
  const parse = (v: string) =>
    normalizeSemver(v)
      .split(".")
      .map((part) => Number.parseInt(part, 10));
  const [aMajor = 0, aMinor = 0, aPatch = 0] = parse(version);
  const [bMajor = 0, bMinor = 0, bPatch = 0] = parse(floor);
  if (aMajor !== bMajor) return aMajor > bMajor;
  if (aMinor !== bMinor) return aMinor > bMinor;
  return aPatch >= bPatch;
}
