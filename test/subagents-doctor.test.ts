import { existsSync } from "node:fs";
import { describe, expect, it } from "vite-plus/test";
import {
  buildSubagentsDoctorReport,
  PI_SUBAGENTS_MODULE,
} from "../src/bootstrap/subagents-doctor.ts";
import { resolveBundledModule } from "../src/bootstrap/resolve-bundled.ts";

describe("subagents doctor", () => {
  it("resolves the j0k3r extension entry", () => {
    const resolved = resolveBundledModule(PI_SUBAGENTS_MODULE, import.meta.url);
    expect(resolved.replaceAll("\\", "/")).toContain(PI_SUBAGENTS_MODULE);
    expect(existsSync(resolved)).toBe(true);
  });

  it("reports runtime and project agent paths", () => {
    const report = buildSubagentsDoctorReport(process.cwd(), "test-session");
    expect(report).toContain("Subagents doctor report");
    expect(report).toContain("pi-subagents-j0k3r");
    expect(report).toContain("project agents:");
    expect(report).toContain("session: test-session");
  });
});
