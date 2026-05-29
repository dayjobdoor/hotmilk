import { describe, expect, it } from "vite-plus/test";
import { isZrokOnPath, resolvePiDashboardCli } from "../src/bootstrap/dashboard.ts";

describe("dashboard bootstrap", () => {
  it("resolves pi-dashboard CLI inside the bundled package", () => {
    const cli = resolvePiDashboardCli();
    expect(cli).toMatch(/pi-dashboard\.mjs$/);
    expect(cli).toContain("@blackbelt-technology/pi-agent-dashboard");
  });

  it("isZrokOnPath returns boolean", () => {
    expect(typeof isZrokOnPath()).toBe("boolean");
  });
});
