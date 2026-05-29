import { execSync, spawn } from "node:child_process";
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { isDashboardRunning } from "@blackbelt-technology/pi-dashboard-shared/server-identity.js";
import { pruneRedundantDashboardPackage } from "./dashboard-settings.ts";
import {
  CONFIG_FILE,
  ensureConfig,
  loadConfig,
} from "@blackbelt-technology/pi-dashboard-shared/config.js";

const require = createRequire(import.meta.url);

/** Bridge auto-start only waits 2s; warm-start via CLI uses 30s readiness. */
export function resolvePiDashboardCli(): string {
  const pkgJson = require.resolve("@blackbelt-technology/pi-agent-dashboard/package.json");
  return path.join(path.dirname(pkgJson), "packages/server/bin/pi-dashboard.mjs");
}

export function isZrokOnPath(): boolean {
  try {
    execSync("command -v zrok", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/**
 * Disable zrok tunnel when the binary is missing — avoids slow/failed tunnel
 * setup and matches local-only hotmilk usage.
 */
export function applyHotmilkDashboardDefaults(): { updated: boolean; path: string } {
  ensureConfig();
  if (isZrokOnPath()) {
    return { updated: false, path: CONFIG_FILE };
  }

  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8")) as Record<string, unknown>;
  } catch {
    return { updated: false, path: CONFIG_FILE };
  }

  const tunnel =
    raw.tunnel && typeof raw.tunnel === "object" ? (raw.tunnel as Record<string, unknown>) : {};
  if (tunnel.enabled === false) {
    return { updated: false, path: CONFIG_FILE };
  }

  raw.tunnel = { ...tunnel, enabled: false };
  fs.writeFileSync(CONFIG_FILE, `${JSON.stringify(raw, null, 2)}\n`, "utf-8");
  return { updated: true, path: CONFIG_FILE };
}

let warmStartScheduled = false;

async function runDashboardWarmStart(): Promise<void> {
  pruneRedundantDashboardPackage();
  applyHotmilkDashboardDefaults();
  const config = loadConfig();
  const status = await isDashboardRunning(config.port, "localhost", {
    timeoutMs: 800,
    retries: 1,
    retryDelayMs: 200,
  });
  if (status.running) {
    return;
  }

  const cli = resolvePiDashboardCli();
  const child = spawn(process.execPath, [cli, "start"], {
    detached: true,
    stdio: "ignore",
    env: process.env,
  });
  child.unref();
}

/**
 * Start the dashboard via `pi-dashboard start` (30s readiness) before the
 * bridge extension's 2s auto-start runs. Fire-and-forget; idempotent.
 */
export function scheduleDashboardWarmStart(): void {
  if (warmStartScheduled) {
    return;
  }
  warmStartScheduled = true;
  void runDashboardWarmStart();
}
