import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import {
  installedPackageJson,
  installedPackageVersion,
  PACKAGE_JSON,
  REPO_ROOT,
  semverAtLeast,
} from "./fixtures/manifest.ts";
import { isJsonObject, isJsonString, parseJsonValue } from "../src/bootstrap/json.ts";
import { makeTempDir } from "./fixtures/tmp.ts";

type NestedInstall = { path: string; name: string; version: string };

type PackageJsonFields = { name?: string; version?: string };

type KnownNestedDrift = { name: string; below: string };

/** Minimum Pi floor for nested @earendil-works supply-chain drift checks. */
const PI_080_FLOOR = "0.80.0";

/** Declared Pi coding-agent package and version range. */
const PI_CODING_AGENT_PACKAGE = "@earendil-works/pi-coding-agent";

type BundledPeerRangeExclusion = {
  packageName: string;
  /** Substring expected in the blocking peer range (remove row when upstream widens peers). */
  excludedVersionPrefix: string;
};

/**
 * Bundled deps whose published peer ranges still exclude Pi 0.80.x.
 * Drop a row when npm publishes 0.80-compatible peers and refresh README peer notes.
 */
const BUNDLED_PEER_RANGES_EXCLUDING_PI_080: readonly BundledPeerRangeExclusion[] = [
  { packageName: "pi-rtk-optimizer", excludedVersionPrefix: "^0.79.0" },
  { packageName: "pi-red-green", excludedVersionPrefix: "^0.74.0" },
];

/**
 * Nested @earendil-works copies still below Pi 0.80 — remove rows when upstream dedupes to 0.80.x.
 * pi-subagents / pi-mcp-adapter are the usual sources.
 */
const KNOWN_NESTED_DRIFT_BELOW_080: readonly KnownNestedDrift[] = [];

function bundledPiPeerRanges(packageName: string): string[] {
  const peers = installedPackageJson(packageName).peerDependencies ?? {};
  return Object.entries(peers)
    .filter(([name]) => name.startsWith("@earendil-works/") || name.startsWith("@mariozechner/"))
    .map(([, range]) => range);
}

function collectNestedEarendilInstalls(root = REPO_ROOT): NestedInstall[] {
  const found: NestedInstall[] = [];
  const nodeModules = join(root, "node_modules");

  function collectPackagesInScopeDir(dir: string, pkgDirName: string): void {
    const scopePath = join(dir, pkgDirName);
    if (!existsSync(scopePath)) return;
    for (const pkg of readdirSync(scopePath)) {
      const pkgJsonPath = join(scopePath, pkg, "package.json");
      if (!existsSync(pkgJsonPath)) continue;
      try {
        const parsed = parseJsonValue(readFileSync(pkgJsonPath, "utf8"));
        if (!isJsonObject(parsed)) continue;
        const pkgJson: PackageJsonFields = {
          name: isJsonString(parsed.name) ? parsed.name : undefined,
          version: isJsonString(parsed.version) ? parsed.version : undefined,
        };
        if (pkgJson.name?.startsWith("@earendil-works/") && pkgJson.version) {
          found.push({
            path: join(scopePath, pkg),
            name: pkgJson.name,
            version: pkgJson.version,
          });
        }
      } catch {
        // skip invalid package.json
      }
    }
  }

  for (const top of readdirSync(nodeModules)) {
    if (top.startsWith("@")) {
      collectPackagesInScopeDir(nodeModules, top);
      continue;
    }
    const topPath = join(nodeModules, top);
    const nestedNodeModulesDir = join(topPath, "node_modules");
    if (!existsSync(nestedNodeModulesDir)) continue;
    for (const nestedTop of readdirSync(nestedNodeModulesDir)) {
      if (nestedTop.startsWith("@")) {
        collectPackagesInScopeDir(nestedNodeModulesDir, nestedTop);
      }
    }
  }

  return found;
}

describe("nested dependency scanner", () => {
  it("finds nested scoped @earendil-works packages", () => {
    const root = makeTempDir("hotmilk-nested-deps-");
    const packagePath = join(
      root,
      "node_modules",
      "parent",
      "node_modules",
      "@earendil-works",
      "pi-child",
    );
    mkdirSync(packagePath, { recursive: true });
    writeFileSync(
      join(packagePath, "package.json"),
      JSON.stringify({ name: "@earendil-works/pi-child", version: "0.79.0" }),
      "utf8",
    );

    expect(collectNestedEarendilInstalls(root)).toEqual([
      {
        path: packagePath,
        name: "@earendil-works/pi-child",
        version: "0.79.0",
      },
    ]);
  });
});

describe("third-party risk (hotmilk meta-package)", () => {
  it("resolves gentle-pi at or above the package.json semver floor", () => {
    const floor = PACKAGE_JSON.dependencies?.["gentle-pi"];
    expect(floor).toBeDefined();
    const resolved = installedPackageVersion("gentle-pi");
    expect(semverAtLeast(resolved, floor!)).toBe(true);
  });

  it("installs Pi coding-agent at its declared devDependency floor", () => {
    const floor = PACKAGE_JSON.devDependencies?.[PI_CODING_AGENT_PACKAGE];
    expect(floor).toBeDefined();
    const version = installedPackageVersion(PI_CODING_AGENT_PACKAGE);
    expect(semverAtLeast(version, floor!)).toBe(true);
  });

  it("keeps Pi peers permissive and aligned to the declared dev range", () => {
    const declaredRange = PACKAGE_JSON.devDependencies?.[PI_CODING_AGENT_PACKAGE];
    expect(declaredRange).toBeDefined();

    const peerEntries = Object.entries(PACKAGE_JSON.peerDependencies ?? {}).filter(([name]) =>
      name.startsWith("@earendil-works/"),
    );
    expect(peerEntries.length).toBeGreaterThan(0);
    for (const [, range] of peerEntries) {
      expect(range).toBe("*");
    }

    const overrideEntries = Object.entries(PACKAGE_JSON.overrides ?? {}).filter(([name]) =>
      name.startsWith("@earendil-works/"),
    );
    expect(overrideEntries.length).toBeGreaterThan(0);
    for (const [, range] of overrideEntries) {
      expect(range).toBe(declaredRange);
    }

    const devEntries = Object.entries(PACKAGE_JSON.devDependencies ?? {}).filter(([name]) =>
      name.startsWith("@earendil-works/"),
    );
    expect(devEntries.length).toBeGreaterThan(0);
    for (const [, range] of devEntries) {
      expect(range).toBe(declaredRange);
    }
  });

  it("tracks bundled deps whose peer ranges still exclude Pi 0.80", () => {
    expect(BUNDLED_PEER_RANGES_EXCLUDING_PI_080.length).toBeGreaterThan(0);
    for (const exclusion of BUNDLED_PEER_RANGES_EXCLUDING_PI_080) {
      const ranges = bundledPiPeerRanges(exclusion.packageName);
      expect(ranges.length).toBeGreaterThan(0);
      expect(ranges.some((range) => range.includes(exclusion.excludedVersionPrefix))).toBe(true);
    }
  });

  it(
    "records known nested @earendil-works copies below Pi 0.80 as supply-chain drift",
    { timeout: 15_000 },
    () => {
      const topLevelScope = join(REPO_ROOT, "node_modules", "@earendil-works");
      const nestedInstalls = collectNestedEarendilInstalls().filter(
        (entry) => !entry.path.startsWith(topLevelScope),
      );
      const installsBelowPi080Floor = nestedInstalls.filter(
        (entry) => !semverAtLeast(entry.version, PI_080_FLOOR),
      );
      const knownNames = new Set(KNOWN_NESTED_DRIFT_BELOW_080.map((known) => known.name));
      const unexpected = installsBelowPi080Floor.filter((entry) => !knownNames.has(entry.name));

      expect(
        unexpected.map((entry) => `${entry.name}@${entry.version} (${entry.path})`),
        "unexpected nested @earendil-works below 0.80 — add to KNOWN_NESTED_DRIFT_BELOW_080 or fix upstream",
      ).toEqual([]);

      for (const known of KNOWN_NESTED_DRIFT_BELOW_080) {
        const matches = installsBelowPi080Floor.filter((entry) => entry.name === known.name);
        expect(
          matches.length,
          `expected nested ${known.name} below ${known.below}`,
        ).toBeGreaterThan(0);
        for (const match of matches) {
          expect(semverAtLeast(match.version, known.below)).toBe(false);
        }
      }
    },
  );
});
