/**
 * Dashboard bridge settings cleanup.
 *
 * Removes redundant standalone dashboard bridge entries from Pi agent settings
 * when hotmilk already bundles the agent-dashboard extension.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const DASHBOARD_EXTENSION_NAME = "@blackbelt-technology/pi-dashboard-extension";
const HOTMILK_PACKAGE_NAME = "hotmilk";

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

function isLocalPackageEntry(entry: string): boolean {
  return entry.startsWith("/") || /^[a-zA-Z]:[/\\]/.test(entry);
}

function isHotmilkPackageEntry(entry: string): boolean {
  if (entry === HOTMILK_PACKAGE_NAME || entry.startsWith(`npm:${HOTMILK_PACKAGE_NAME}`)) {
    return true;
  }
  if (!isLocalPackageEntry(entry)) {
    return false;
  }
  return readPackageName(entry) === HOTMILK_PACKAGE_NAME;
}

function isBundledDashboardExtensionEntry(entry: string): boolean {
  if (!isLocalPackageEntry(entry)) {
    return false;
  }
  return readPackageName(entry) === DASHBOARD_EXTENSION_NAME;
}

/** Options for {@link pruneRedundantDashboardPackage}. */
export interface PruneDashboardSettingsOptions {
  /** Override `$HOME` resolution. */
  homedir?: string;
}

/**
 * Drop standalone dashboard-bridge paths from `~/.pi/agent/settings.json`.
 *
 * The bundled agent-dashboard extension already provides the bridge, so the
 * legacy standalone package entry is redundant.
 *
 * @param opts - optional overrides
 * @returns whether any entries were removed
 */
export function pruneRedundantDashboardPackage(opts: PruneDashboardSettingsOptions = {}): boolean {
  const home = opts.homedir ?? process.env.HOME ?? process.env.USERPROFILE ?? os.homedir();
  const settingsPath = path.join(home, ".pi", "agent", "settings.json");
  if (!fs.existsSync(settingsPath)) {
    return false;
  }

  let settings: Record<string, unknown>;
  try {
    const raw = fs.readFileSync(settingsPath, "utf-8").trim();
    if (!raw) return false;
    settings = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return false;
  }

  const packages = Array.isArray(settings.packages) ? (settings.packages as string[]) : [];
  if (!packages.some(isHotmilkPackageEntry)) {
    return false;
  }

  const cleaned = packages.filter((entry) => !isBundledDashboardExtensionEntry(entry));
  if (cleaned.length === packages.length) {
    return false;
  }

  settings.packages = cleaned;
  const tmp = `${settingsPath}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(settings, null, 2)}\n`, "utf-8");
  fs.renameSync(tmp, settingsPath);
  return true;
}
