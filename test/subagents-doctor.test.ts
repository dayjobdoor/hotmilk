import { existsSync } from "node:fs";
import { describe, expect, it } from "vite-plus/test";
import { bundledImportUrl, resolveBundledModule } from "../src/bootstrap/resolve-bundled.ts";
import { PI_SUBAGENTS_DOCTOR_MODULES } from "../src/bootstrap/subagents-doctor.ts";
import type { JsonObject } from "../src/json.ts";

type DoctorReportInput = {
  cwd: string;
  config: JsonObject;
  state: { baseCwd: string; currentSessionId: string | null };
  deps: {
    discoverAgentsAll: () => {
      builtin: never[];
      user: never[];
      project: never[];
      chains: never[];
    };
    discoverAvailableSkills: () => never[];
    diagnoseIntercomBridge: () => {
      active: boolean;
      mode: string;
      orchestratorTarget: undefined;
      piIntercomAvailable: boolean;
      extensionDir: string;
    };
    isAsyncAvailable: () => boolean;
  };
};

type DoctorModule = {
  buildDoctorReport: (input: DoctorReportInput) => string;
};

describe("subagents doctor (bundled third-party path)", () => {
  it("resolves every deep doctor module from the hotmilk dependency tree", () => {
    for (const relative of Object.values(PI_SUBAGENTS_DOCTOR_MODULES)) {
      const resolved = resolveBundledModule(relative, import.meta.url);
      expect(resolved.replaceAll("\\", "/")).toContain(relative);
      expect(existsSync(resolved)).toBe(true);
    }
  });

  it("buildDoctorReport includes runtime, filesystem, and discovery sections", async () => {
    // Dynamic import: doctor path is resolved from the bundled third-party tree at runtime.
    // SAFETY: bundled doctor module exports buildDoctorReport with this shape.
    const mod = (await import(
      bundledImportUrl(PI_SUBAGENTS_DOCTOR_MODULES.doctor)
    )) as DoctorModule;

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
