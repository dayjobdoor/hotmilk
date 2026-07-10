/**
 * Dashboard warm-start and config migration.
 *
 * Prepares the bundled agent-dashboard extension by migrating the upstream
 * default port, disabling zrok when unavailable, and launching the server so
 * the bridge extension sees a healthy dashboard on session start.
 */

import { execSync } from "node:child_process";
import { createRequire } from "node:module";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import type { DashboardConfig } from "@blackbelt-technology/pi-dashboard-shared/config.js";
import {
  CONFIG_FILE,
  ensureConfig,
  loadConfig,
} from "@blackbelt-technology/pi-dashboard-shared/config.js";
import { isDashboardRunning } from "@blackbelt-technology/pi-dashboard-shared/server-identity.js";
import {
  EarlyExitError,
  launchDashboardServer,
  PortConflictError,
} from "@blackbelt-technology/pi-dashboard-shared/server-launcher.js";
import { pruneRedundantDashboardPackage } from "./dashboard-settings.ts";

const require = createRequire(import.meta.url);

/** hotmilk default dashboard HTTP port (avoids common 8000 conflicts). */
export const HOTMILK_DASHBOARD_PORT = 8102;

/** Upstream pi-agent-dashboard default before hotmilk applies its seed. */
export const UPSTREAM_DASHBOARD_DEFAULT_PORT = 8000;

/** Cold dashboard bootstrap (jiti + session scan) can exceed bridge's 2s probe. */
const WARM_START_PROBE_OPTS = {
  timeoutMs: 8_000,
  retries: 3,
  retryDelayMs: 500,
} as const;

const WARM_START_HEALTH_TIMEOUT_MS = 60_000;

/** @returns the path to the dashboard server log file under `~/.pi/dashboard`. */
export function dashboardServerLogPath(): string {
  return path.join(os.homedir(), ".pi", "dashboard", "server.log");
}

/**
 * Resolve the bundled `@blackbelt-technology/pi-agent-dashboard` server CLI.
 *
 * @returns absolute path to `pi-dashboard.mjs`.
 */
export function resolvePiDashboardCli(): string {
  const pkgJson = require.resolve("@blackbelt-technology/pi-agent-dashboard/package.json");
  return path.join(path.dirname(pkgJson), "packages/server/bin/pi-dashboard.mjs");
}

/**
 * Resolve the dashboard server entry script used by {@link launchDashboardServer}.
 *
 * @returns absolute path to the server CLI source.
 */
export function resolveDashboardServerCliPath(): string {
  const pkgJson = require.resolve("@blackbelt-technology/pi-dashboard-server/package.json");
  return path.join(path.dirname(pkgJson), "src", "cli.ts");
}

/**
 * Build command-line args for a warm-start launch.
 *
 * @param config - dashboard config (port + pi gateway port)
 * @returns CLI args like `["--port", "8102", "--pi-port", "9999"]`
 */
export function buildWarmStartLaunchArgs(
  config: Pick<DashboardConfig, "port" | "piPort">,
): string[] {
  return ["--port", String(config.port), "--pi-port", String(config.piPort)];
}

/**
 * Probe whether a TCP port is currently free.
 *
 * @param port - port to test
 * @param host - interface to bind (default: 127.0.0.1)
 */
export function isTcpPortFree(port: number, host = "127.0.0.1"): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, host);
  });
}

/**
 * Pick a free pi gateway port descending from a preferred value.
 *
 * @param preferred - starting port
 * @param isFree - port probe function (default: {@link isTcpPortFree})
 * @param maxAttempts - how many ports to try
 * @returns the first free port, or `preferred` if none are found
 */
export async function resolveAvailablePiPort(
  preferred: number,
  isFree: (port: number) => Promise<boolean> = isTcpPortFree,
  maxAttempts = 20,
): Promise<number> {
  for (let offset = 0; offset < maxAttempts; offset += 1) {
    const candidate = preferred - offset;
    if (candidate <= 0) {
      break;
    }
    if (await isFree(candidate)) {
      return candidate;
    }
  }
  return preferred;
}

/**
 * Persist the chosen pi gateway port to dashboard config.
 *
 * @param piPort - port to save
 * @returns whether the file was actually changed
 */
export function persistDashboardPiPort(piPort: number): boolean {
  ensureConfig();
  const raw = readDashboardConfigRaw();
  if (!raw || raw.piPort === piPort) {
    return false;
  }
  raw.piPort = piPort;
  writeDashboardConfigRaw(raw);
  return true;
}

/** Decision made by {@link resolveDashboardWarmStartDecision}. */
export type DashboardWarmStartDecision = "skip-running" | "skip-conflict" | "launch";

/** When TCP is bound but /api/health is not ready yet (cold boot). */
const WARM_START_PORT_OCCUPIED_WAIT_MS = 5_000;
const WARM_START_PORT_OCCUPIED_POLL_MS = 500;

export type DashboardWarmStartDecisionOpts = {
  occupiedWaitMs?: number;
  occupiedPollMs?: number;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Decide whether the dashboard needs a warm-start launch.
 *
 * Skips when already running, waits briefly for a cold boot to become ready,
 * and treats persistent occupancy as a conflict.
 *
 * @param port - dashboard HTTP port
 * @param probe - running-state probe (default: `isDashboardRunning`)
 * @param isFree - TCP port probe (default: {@link isTcpPortFree})
 * @param opts - wait/poll timing overrides
 */
export async function resolveDashboardWarmStartDecision(
  port: number,
  probe: typeof isDashboardRunning = isDashboardRunning,
  isFree: (port: number) => Promise<boolean> = isTcpPortFree,
  opts: DashboardWarmStartDecisionOpts = {},
): Promise<DashboardWarmStartDecision> {
  const occupiedWaitMs = opts.occupiedWaitMs ?? WARM_START_PORT_OCCUPIED_WAIT_MS;
  const occupiedPollMs = opts.occupiedPollMs ?? WARM_START_PORT_OCCUPIED_POLL_MS;
  let status = await probe(port, "localhost", WARM_START_PROBE_OPTS);
  if (status.running) {
    return "skip-running";
  }
  if (status.portConflict) {
    return "skip-conflict";
  }

  if (!(await isFree(port))) {
    const deadline = Date.now() + occupiedWaitMs;
    while (Date.now() < deadline) {
      await sleep(occupiedPollMs);
      status = await probe(port, "localhost", WARM_START_PROBE_OPTS);
      if (status.running) {
        return "skip-running";
      }
      if (status.portConflict) {
        return "skip-conflict";
      }
      if (await isFree(port)) {
        return "launch";
      }
    }
    status = await probe(port, "localhost", WARM_START_PROBE_OPTS);
    if (status.running) {
      return "skip-running";
    }
    return "skip-conflict";
  }

  return "launch";
}

/** @returns whether the `zrok` binary is available on `$PATH`. */
export function isZrokOnPath(): boolean {
  try {
    execSync("command -v zrok", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function readDashboardConfigRaw(): Record<string, unknown> | undefined {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8")) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

function writeDashboardConfigRaw(raw: Record<string, unknown>): void {
  fs.writeFileSync(CONFIG_FILE, `${JSON.stringify(raw, null, 2)}\n`, "utf-8");
}

/** Result of {@link applyHotmilkDashboardDefaults}. */
export type ApplyHotmilkDashboardDefaultsResult = {
  updated: boolean;
  path: string;
};

/**
 * Apply hotmilk-specific dashboard defaults to a parsed config object.
 *
 * Preserves custom ports; only migrates upstream default `8000` to
 * {@link HOTMILK_DASHBOARD_PORT}. Disables the zrok tunnel when zrok is missing.
 *
 * @param raw - parsed dashboard config
 * @param opts - optional zrok availability override
 * @returns whether any changes were made
 */
export function applyHotmilkDashboardDefaultsToRaw(
  raw: Record<string, unknown>,
  opts: { zrokAvailable?: boolean } = {},
): boolean {
  const zrokAvailable = opts.zrokAvailable ?? isZrokOnPath();
  let updated = false;

  const port = raw.port;
  if (port === undefined || port === UPSTREAM_DASHBOARD_DEFAULT_PORT) {
    raw.port = HOTMILK_DASHBOARD_PORT;
    updated = true;
  }

  if (!zrokAvailable) {
    const tunnel =
      raw.tunnel && typeof raw.tunnel === "object" ? (raw.tunnel as Record<string, unknown>) : {};
    if (tunnel.enabled !== false) {
      raw.tunnel = { ...tunnel, enabled: false };
      updated = true;
    }
  }

  return updated;
}

/**
 * Seed hotmilk dashboard defaults into `~/.pi/dashboard/config.json`.
 *
 * @returns whether the file was updated
 */
export function applyHotmilkDashboardDefaults(): ApplyHotmilkDashboardDefaultsResult {
  ensureConfig();

  const raw = readDashboardConfigRaw();
  if (!raw || !applyHotmilkDashboardDefaultsToRaw(raw)) {
    return { updated: false, path: CONFIG_FILE };
  }

  writeDashboardConfigRaw(raw);
  return { updated: true, path: CONFIG_FILE };
}

/** Dedupes concurrent warm-start only; each session_start/reload re-probes. */
let warmStartInFlight: Promise<DashboardWarmStartResult> | undefined;

/** Reset the in-flight warm-start promise so tests can re-launch. */
export function resetDashboardWarmStartForTests(): void {
  warmStartInFlight = undefined;
}

/** Result returned by {@link ensureDashboardWarmStarted}. */
export type DashboardWarmStartResult = {
  status: "running" | "started" | "skipped-conflict" | "failed";
  port: number;
  piPort: number;
  message?: string;
};

function warmStartResult(
  status: DashboardWarmStartResult["status"],
  port: number,
  piPort: number,
  message?: string,
): DashboardWarmStartResult {
  return { status, port, piPort, message };
}

/**
 * Start the dashboard via shared launcher and wait until it is ready.
 *
 * Concurrent calls are deduplicated. The bridge extension then sees a healthy
 * server during its short auto-start probe.
 *
 * @returns warm-start outcome
 */
export async function ensureDashboardWarmStarted(): Promise<DashboardWarmStartResult> {
  if (warmStartInFlight) {
    return warmStartInFlight;
  }

  warmStartInFlight = runDashboardWarmStart().finally(() => {
    warmStartInFlight = undefined;
  });
  return warmStartInFlight;
}

async function runDashboardWarmStart(): Promise<DashboardWarmStartResult> {
  pruneRedundantDashboardPackage();
  applyHotmilkDashboardDefaults();
  const config = loadConfig();
  const decision = await resolveDashboardWarmStartDecision(config.port);
  if (decision === "skip-running") {
    return warmStartResult("running", config.port, config.piPort);
  }
  if (decision === "skip-conflict") {
    return warmStartResult(
      "skipped-conflict",
      config.port,
      config.piPort,
      `Port ${config.port} is occupied by a non-dashboard service`,
    );
  }

  let piPort = config.piPort;
  if (!(await isTcpPortFree(piPort))) {
    const resolved = await resolveAvailablePiPort(piPort);
    if (resolved !== piPort) {
      persistDashboardPiPort(resolved);
      piPort = resolved;
    }
  }

  const launchConfig = { port: config.port, piPort };

  const cliPath = resolveDashboardServerCliPath();

  try {
    await launchDashboardServer({
      cliPath,
      anchor: cliPath,
      extraArgs: buildWarmStartLaunchArgs(launchConfig),
      stdio: { logFile: dashboardServerLogPath() },
      starter: "Hotmilk",
      healthTimeoutMs: WARM_START_HEALTH_TIMEOUT_MS,
      port: launchConfig.port,
    });
    return warmStartResult("started", launchConfig.port, launchConfig.piPort);
  } catch (err: unknown) {
    const { port, piPort } = launchConfig;
    const recheck = await isDashboardRunning(port, "localhost", WARM_START_PROBE_OPTS);
    if (recheck.running) {
      return warmStartResult("running", port, piPort);
    }
    if (err instanceof PortConflictError || err instanceof EarlyExitError) {
      return warmStartResult("failed", port, piPort, err.message);
    }
    const detail = err instanceof Error ? err.message : String(err);
    return warmStartResult("failed", port, piPort, `${detail}. See ${dashboardServerLogPath()}`);
  }
}

/**
 * Warn when the dashboard doctor may flag hotmilk-managed warm-start.
 *
 * Hotmilk uses bundled jiti, so legacy `~/.pi-dashboard` warnings can be ignored
 * when `/api/health` is healthy.
 *
 * @param result - warm-start result
 */
export function logHotmilkDashboardDoctorHint(result: DashboardWarmStartResult): void {
  if (result.status !== "running" && result.status !== "started") {
    return;
  }
  const managedDir = path.join(os.homedir(), ".pi-dashboard");
  if (fs.existsSync(managedDir)) {
    return;
  }
  console.warn(
    `[hotmilk] Dashboard doctor may warn about TypeScript loader or ~/.pi-dashboard — hotmilk uses bundled jiti on port ${result.port}. Ignore if http://localhost:${result.port}/api/health is ok.`,
  );
}
