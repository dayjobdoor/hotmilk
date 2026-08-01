import { execSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import {
  installedPackageJson,
  installedPackageVersion,
  PACKAGE_JSON,
  REPO_ROOT,
  semverAtLeast,
} from "./fixtures/manifest.ts";

/** Minimum Pi floor for nested @earendil-works supply-chain drift checks. */
const PI_080_FLOOR = "0.80.0";

/** Declared hotmilk peer target (dev/peer/overrides). */
const PI_PEER_TARGET = /0\.83/;
const PI_TOP_FLOOR = "0.83.0";

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
  { packageName: "pi-docparser", excludedVersionPrefix: "^0.74.0" },
  { packageName: "pi-red-green", excludedVersionPrefix: "^0.74.0" },
];

/**
 * Nested @earendil-works copies still below Pi 0.80 — remove rows when upstream dedupes to 0.80.x.
 * pi-subagents / pi-mcp-adapter / agent-dashboard server are the usual sources.
 */
const KNOWN_NESTED_DRIFT_BELOW_080: readonly { name: string; below: string }[] = [];

function bundledPiPeerRanges(packageName: string): string[] {
  const peers = installedPackageJson(packageName).peerDependencies ?? {};
  return Object.entries(peers)
    .filter(([name]) => name.startsWith("@earendil-works/") || name.startsWith("@mariozechner/"))
    .map(([, range]) => range);
}

function collectNestedEarendilInstalls(): Array<{ path: string; name: string; version: string }> {
  const found: Array<{ path: string; name: string; version: string }> = [];
  const nodeModules = join(REPO_ROOT, "node_modules");

  function collectPackagesInScopeDir(dir: string, pkgDirName: string): void {
    const scopePath = join(dir, pkgDirName);
    if (!existsSync(scopePath)) return;
    for (const pkg of readdirSync(scopePath)) {
      const pkgJsonPath = join(scopePath, pkg, "package.json");
      if (!existsSync(pkgJsonPath)) continue;
      try {
        const pkgJson = JSON.parse(readFileSync(pkgJsonPath, "utf8")) as {
          name?: string;
          version?: string;
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

describe("third-party risk (hotmilk meta-package)", () => {
  it("resolves gentle-pi at or above the package.json semver floor", () => {
    const floor = PACKAGE_JSON.dependencies?.["gentle-pi"];
    expect(floor).toBeDefined();
    const resolved = installedPackageVersion("gentle-pi");
    expect(semverAtLeast(resolved, floor!)).toBe(true);
  });

  it("installs Pi 0.83 coding-agent at the top level", () => {
    const version = installedPackageVersion("@earendil-works/pi-coding-agent");
    expect(semverAtLeast(version, PI_TOP_FLOOR)).toBe(true);
  });

  it("declares Pi 0.83 peers on hotmilk itself", () => {
    for (const [name, range] of Object.entries(PACKAGE_JSON.peerDependencies ?? {})) {
      if (name.startsWith("@earendil-works/")) {
        expect(range).toMatch(PI_PEER_TARGET);
      }
    }
  });

  it("tracks bundled deps whose peer ranges still exclude Pi 0.80", () => {
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

  it("has no critical npm audit findings in production dependencies", { timeout: 60_000 }, () => {
    let output = "";
    try {
      output = execSync("npm audit --audit-level=critical --omit=dev --json", {
        cwd: REPO_ROOT,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch (error) {
      const err = error as { stdout?: string; status?: number };
      output = err.stdout ?? "";
      if (!output) throw error;
    }

    const report = JSON.parse(output) as {
      metadata?: { vulnerabilities?: { critical?: number } };
    };
    const critical = report.metadata?.vulnerabilities?.critical ?? 0;
    expect(critical).toBe(0);
  });
});
