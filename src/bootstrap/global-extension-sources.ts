import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  detectGlobalProviderForBundledExtension,
  HOTMILK_PACKAGE_NAME,
} from "../config/bundled-package-registry.ts";
import { BUNDLED_EXTENSION_IDS, type BundledExtensionId } from "../config/hotmilk.ts";

const PI_PROJECT_CONFIG_DIR = ".pi";

export type GlobalBundledExtensionSkip = {
  id: BundledExtensionId;
  packageName: string;
};

export type CollectGlobalExtensionSourcesOptions = {
  cwd?: string;
  homedir?: string;
};

function isLocalPackageEntry(entry: string): boolean {
  return entry.startsWith("/") || /^[a-zA-Z]:[/\\]/.test(entry);
}

function readPackageName(dir: string): string | null {
  try {
    const pkgPath = path.join(dir, "package.json");
    if (!fs.existsSync(pkgPath)) return null;
    const parsed = JSON.parse(fs.readFileSync(pkgPath, "utf-8")) as { name?: unknown };
    return typeof parsed.name === "string" ? parsed.name : null;
  } catch {
    return null;
  }
}

function resolvePackageNameFromLocalPath(entry: string, baseDir: string): string | null {
  const resolved = path.isAbsolute(entry) ? entry : path.resolve(baseDir, entry);
  if (!fs.existsSync(resolved)) {
    return null;
  }

  let dir = resolved;
  try {
    if (!fs.statSync(resolved).isDirectory()) {
      dir = path.dirname(resolved);
    }
  } catch {
    return null;
  }

  while (true) {
    const name = readPackageName(dir);
    if (name) {
      return name;
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      return null;
    }
    dir = parent;
  }
}

/** Parse `npm:@scope/pkg@1.2.3` → `@scope/pkg`, or `npm:pkg` → `pkg`. */
export function parseNpmPackageName(entry: string): string | null {
  const trimmed = entry.trim();
  if (!trimmed.startsWith("npm:")) {
    return null;
  }

  const spec = trimmed.slice("npm:".length).trim();
  if (!spec) {
    return null;
  }

  const versionAt = spec.startsWith("@") ? spec.indexOf("@", 1) : spec.indexOf("@");
  return versionAt === -1 ? spec : spec.slice(0, versionAt);
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];
}

function readSettingsEntries(settingsPath: string): string[] {
  if (!fs.existsSync(settingsPath)) {
    return [];
  }

  try {
    const raw = fs.readFileSync(settingsPath, "utf-8").trim();
    if (!raw) return [];
    const settings = JSON.parse(raw) as Record<string, unknown>;
    return [...toStringArray(settings.packages), ...toStringArray(settings.extensions)];
  } catch {
    return [];
  }
}

/** Collect npm package names referenced by Pi settings (global + project). */
export function collectInstalledPackageNamesFromPiSettings(
  options: CollectGlobalExtensionSourcesOptions = {},
): Set<string> {
  const home = options.homedir ?? process.env.HOME ?? process.env.USERPROFILE ?? os.homedir();
  const cwd = options.cwd ?? process.cwd();
  const names = new Set<string>();

  const sources: Array<{ settingsPath: string; baseDir: string }> = [
    {
      settingsPath: path.join(home, ".pi", "agent", "settings.json"),
      baseDir: path.join(home, ".pi", "agent"),
    },
    { settingsPath: path.join(cwd, PI_PROJECT_CONFIG_DIR, "settings.json"), baseDir: cwd },
  ];

  for (const { settingsPath, baseDir } of sources) {
    for (const entry of readSettingsEntries(settingsPath)) {
      const npmName = parseNpmPackageName(entry);
      if (npmName) {
        names.add(npmName);
        continue;
      }

      if (isLocalPackageEntry(entry)) {
        const localName = resolvePackageNameFromLocalPath(entry, baseDir);
        if (localName) {
          names.add(localName);
        }
      }
    }
  }

  names.delete(HOTMILK_PACKAGE_NAME);
  return names;
}

/** Bundled ids that should not register because Pi settings already provide the package. */
export function detectGlobalBundledExtensionSkips(
  options: CollectGlobalExtensionSourcesOptions = {},
): GlobalBundledExtensionSkip[] {
  const installed = collectInstalledPackageNamesFromPiSettings(options);
  const skips: GlobalBundledExtensionSkip[] = [];

  for (const id of BUNDLED_EXTENSION_IDS) {
    const packageName = detectGlobalProviderForBundledExtension(id, installed);
    if (packageName) {
      skips.push({ id, packageName });
    }
  }

  return skips;
}
