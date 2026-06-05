import { existsSync } from "node:fs";
import { describe, expect, it } from "vite-plus/test";
import { bundledImportUrl, resolveBundledModule } from "../src/bootstrap/resolve-bundled.ts";

const DOCTOR_MODULE = "pi-subagents/src/extension/doctor.ts";

describe("subagents doctor (bundled third-party path)", () => {
  it("resolves pi-subagents doctor from the hotmilk dependency tree", () => {
    const resolved = resolveBundledModule(DOCTOR_MODULE, import.meta.url);
    expect(resolved).toMatch(/pi-subagents[/\\]src[/\\]extension[/\\]doctor\.ts$/);
    expect(existsSync(resolved)).toBe(true);
  });

  it("buildDoctorReport includes runtime, filesystem, and discovery sections", async () => {
    const mod = (await import(bundledImportUrl(DOCTOR_MODULE))) as {
      buildDoctorReport: (input: Record<string, unknown>) => string;
    };

    const report = mod.buildDoctorReport({
      cwd: process.cwd(),
      config: { intercomBridge: { mode: "always" } },
      state: { baseCwd: process.cwd(), currentSessionId: "test" },
      deps: {
        discoverAgentsAll: () => ({
          builtin: [],
          user: [],
          project: [],
          chains: [],
        }),
        discoverAvailableSkills: () => [],
        diagnoseIntercomBridge: () => ({
          active: false,
          mode: "always",
          orchestratorTarget: undefined,
          piIntercomAvailable: false,
          extensionDir: "/tmp/pi-intercom-mock",
        }),
        isAsyncAvailable: () => true,
      },
    });

    expect(report).toContain("Subagents doctor report");
    expect(report).toContain("async support:");
    expect(report).toContain("chain runs:");
    expect(report).toContain("agents:");
    expect(report).toContain("Intercom bridge");
  }, 20_000);
});
