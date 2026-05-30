import { describe, expect, it } from "vite-plus/test";
import {
  applyHotmilkDashboardDefaultsToRaw,
  buildWarmStartLaunchArgs,
  HOTMILK_DASHBOARD_PORT,
  isZrokOnPath,
  resolveAvailablePiPort,
  resolveDashboardServerCliPath,
  resolveDashboardWarmStartDecision,
  resolvePiDashboardCli,
  UPSTREAM_DASHBOARD_DEFAULT_PORT,
} from "../src/bootstrap/dashboard.ts";

describe("dashboard bootstrap", () => {
  it("resolves pi-dashboard CLI inside the bundled package", () => {
    const cli = resolvePiDashboardCli();
    expect(cli).toMatch(/pi-dashboard\.mjs$/);
    expect(cli).toContain("@blackbelt-technology/pi-agent-dashboard");
  });

  it("resolves dashboard server CLI for warm-start launcher", () => {
    const cli = resolveDashboardServerCliPath();
    expect(cli).toMatch(/cli\.ts$/);
    expect(cli).toContain("@blackbelt-technology/pi-dashboard-server");
  });

  it.each([
    { port: UPSTREAM_DASHBOARD_DEFAULT_PORT, piPort: 9999 },
    { port: HOTMILK_DASHBOARD_PORT, piPort: 9999 },
    { port: 9000, piPort: 1234 },
  ])("buildWarmStartLaunchArgs passes port $port and piPort $piPort", ({ port, piPort }) => {
    expect(buildWarmStartLaunchArgs({ port, piPort })).toEqual([
      "--port",
      String(port),
      "--pi-port",
      String(piPort),
    ]);
  });

  it("resolveAvailablePiPort returns the first free port at or below preferred", async () => {
    const free = new Set([9997, 9996]);
    const resolved = await resolveAvailablePiPort(9999, async (port) => free.has(port));
    expect(resolved).toBe(9997);
  });

  it("applyHotmilkDashboardDefaultsToRaw migrates upstream port 8000 to hotmilk 8102", () => {
    const raw: Record<string, unknown> = {
      port: UPSTREAM_DASHBOARD_DEFAULT_PORT,
      tunnel: { enabled: true },
    };
    expect(applyHotmilkDashboardDefaultsToRaw(raw, { zrokAvailable: true })).toBe(true);
    expect(raw.port).toBe(HOTMILK_DASHBOARD_PORT);
  });

  it("applyHotmilkDashboardDefaultsToRaw preserves custom dashboard port", () => {
    const raw: Record<string, unknown> = { port: 9000, tunnel: { enabled: false } };
    expect(applyHotmilkDashboardDefaultsToRaw(raw, { zrokAvailable: true })).toBe(false);
    expect(raw.port).toBe(9000);
  });

  it("resolveDashboardWarmStartDecision skips when dashboard is already running", async () => {
    const decision = await resolveDashboardWarmStartDecision(8000, async () => ({
      running: true,
      pid: 42,
    }));
    expect(decision).toBe("skip-running");
  });

  it("resolveDashboardWarmStartDecision skips on port conflict", async () => {
    const decision = await resolveDashboardWarmStartDecision(8000, async () => ({
      running: false,
      portConflict: true,
    }));
    expect(decision).toBe("skip-conflict");
  });

  it("resolveDashboardWarmStartDecision launches when port is free", async () => {
    const decision = await resolveDashboardWarmStartDecision(8000, async () => ({
      running: false,
    }));
    expect(decision).toBe("launch");
  });

  it("isZrokOnPath returns boolean", () => {
    expect(typeof isZrokOnPath()).toBe("boolean");
  });
});
