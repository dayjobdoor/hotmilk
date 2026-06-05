import { execSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { resolveBundledModule } from "../src/bootstrap/resolve-bundled.ts";
import { BUNDLED_EXTENSION_DEFINITIONS } from "../src/config/bundled-extensions.ts";

const ROOT = join(import.meta.dirname, "..");
const PACKAGE_JSON = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as {
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

/** Critical bundled entrypoints — wrong resolution breaks Pi sessions at runtime. */
const BUNDLED_ENTRYPOINTS = [
  "pi-subagents/src/extension/index.ts",
  "pi-subagents/src/extension/doctor.ts",
  "gentle-pi/extensions/gentle-ai.ts",
  "context-mode/build/adapters/pi/extension.js",
  "graphify-pi/extensions/graphify.ts",
] as const;

function parseMajor(version: string): number | null {
  const match = version.match(/(\d+)\./);
  return match ? Number.parseInt(match[1], 10) : null;
}

function collectNestedEarendilInstalls(): Array<{ path: string; name: string; version: string }> {
  const found: Array<{ path: string; name: string; version: string }> = [];
  const nodeModules = join(ROOT, "node_modules");

  function walkScoped(dir: string, pkgDirName: string): void {
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
      walkScoped(nodeModules, top);
      continue;
    }
    const topPath = join(nodeModules, top);
    const nested = join(topPath, "node_modules");
    if (!existsSync(nested)) continue;
    for (const nestedTop of readdirSync(nested)) {
      if (nestedTop.startsWith("@")) {
        walkScoped(nested, nestedTop);
      }
    }
  }

  return found;
}

describe("third-party risk (hotmilk meta-package)", () => {
  it("lists every bundled primary package in package.json dependencies", () => {
    const deps = new Set(Object.keys(PACKAGE_JSON.dependencies ?? {}));
    for (const definition of BUNDLED_EXTENSION_DEFINITIONS) {
      expect(deps.has(definition.package.packageName)).toBe(true);
    }
  });

  it("declares Pi 0.78 peers on hotmilk itself", () => {
    for (const [name, range] of Object.entries(PACKAGE_JSON.peerDependencies ?? {})) {
      if (name.startsWith("@earendil-works/")) {
        expect(range).toMatch(/0\.78/);
      }
    }
  });

  it("resolves critical bundled entrypoints from the install layout", () => {
    for (const modulePath of BUNDLED_ENTRYPOINTS) {
      expect(existsSync(resolveBundledModule(modulePath, import.meta.url))).toBe(true);
    }
  });

  it("records nested @earendil-works copies below major 78 as supply-chain drift", () => {
    const nested = collectNestedEarendilInstalls().filter(
      (entry) => !entry.path.startsWith(join(ROOT, "node_modules", "@earendil-works")),
    );
    const stale = nested.filter((entry) => {
      const major = parseMajor(entry.version);
      return major !== null && major < 78;
    });

    // Known: pi-subagents pins pi-tui ^0.74 as a direct dependency (nested copy).
    expect(stale.length).toBeGreaterThan(0);
    expect(stale.some((entry) => entry.name === "@earendil-works/pi-tui")).toBe(true);
  });

  it("has no critical npm audit findings in production dependencies", { timeout: 60_000 }, () => {
    let output = "";
    try {
      output = execSync("npm audit --audit-level=critical --omit=dev --json", {
        cwd: ROOT,
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
