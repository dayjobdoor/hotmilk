/**
 * Detect bundled extensions that the user already installed globally or locally.
 *
 * Skips registering those extensions a second time through hotmilk.
 */

import fs from "node:fs";
import path from "node:path";
import { getAgentDir } from "@earendil-works/pi-coding-agent";
import {
  detectGlobalProviderForBundledExtension,
  HOTMILK_PACKAGE_NAME,
} from "../config/bundled-package-registry.ts";
import { BUNDLED_EXTENSION_IDS, type BundledExtensionId } from "../config/hotmilk.ts";
import { isJsonObject, isJsonString, parseJsonValue, type JsonValue } from "../json.ts";

const PI_PROJECT_CONFIG_DIR = ".pi";

/** A bundled extension that should be skipped because it is already installed. */
export type GlobalBundledExtensionSkip = {
  id: BundledExtensionId;
  packageName: string;
};

/** Options for reading Pi settings files. */
export type CollectGlobalExtensionSourcesOptions = {
  /** Project root for resolving local package paths. */
  cwd?: string;
  /** Override `$HOME` resolution. */
  homedir?: string;
  /** When false, skip project `.pi/settings.json` (Pi project trust gate). */
  includeProjectSettings?: boolean;
};

function isLocalPackageEntry(entry: string): boolean {
  return entry.startsWith("/") || /^[a-zA-Z]:[/\\]/.test(entry);
}

function readPackageName(dir: string): string | null {
  try {
    const pkgPath = path.join(dir, "package.json");
    if (!fs.existsSync(pkgPath)) return null;
    const parsed = parseJsonValue(fs.readFileSync(pkgPath, "utf-8"));
    if (!isJsonObject(parsed)) return null;
    const name = parsed.name;
    return isJsonString(name) ? name : null;
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

/**
 * Extract the package name from a Pi `npm:` settings entry.
 *
 * @example `npm:@scope/pkg@1.2.3` → `@scope/pkg`
 * @example `npm:pkg` → `pkg`
 *
 * @param entry - raw settings entry
 */
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

function toStringArray(value: JsonValue | undefined): string[] {
  if (value === undefined || !Array.isArray(value)) {
    return [];
  }
  const entries: string[] = [];
  for (const entry of value) {
    if (isJsonString(entry)) {
      entries.push(entry);
    }
  }
  return entries;
}

function readSettingsEntries(settingsPath: string): string[] {
  if (!fs.existsSync(settingsPath)) {
    return [];
  }

  try {
    const raw = fs.readFileSync(settingsPath, "utf-8").trim();
    if (!raw) return [];
    const parsed = parseJsonValue(raw);
    if (!isJsonObject(parsed)) {
      return [];
    }
    return [...toStringArray(parsed.packages), ...toStringArray(parsed.extensions)];
  } catch {
    return [];
  }
}

function resolveGlobalAgentDir(options: CollectGlobalExtensionSourcesOptions): string {
  if (options.homedir) {
    return path.join(options.homedir, ".pi", "agent");
  }
  return getAgentDir();
}

/**
 * Collect npm package names referenced by Pi settings (global + project).
 *
 * Resolves local package paths to their `package.json` `name`.
 *
 * @param options - settings search options
 * @returns set of installed package names, excluding hotmilk itself
 */
export function collectInstalledPackageNamesFromPiSettings(
  options: CollectGlobalExtensionSourcesOptions = {},
): Set<string> {
  const agentDir = resolveGlobalAgentDir(options);
  const cwd = options.cwd ?? process.cwd();
  const includeProjectSettings = options.includeProjectSettings ?? true;
  const names = new Set<string>();

  const sources: Array<{ settingsPath: string; baseDir: string }> = [
    {
      settingsPath: path.join(agentDir, "settings.json"),
      baseDir: agentDir,
    },
  ];

  if (includeProjectSettings) {
    sources.push({
      settingsPath: path.join(cwd, PI_PROJECT_CONFIG_DIR, "settings.json"),
      baseDir: cwd,
    });
  }

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

/**
 * Find bundled ids that should not register because Pi settings already
 * provide the same package.
 *
 * @param options - settings search options
 * @returns list of bundled ids to skip and the package that replaces them
 */
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
