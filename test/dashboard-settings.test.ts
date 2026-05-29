import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { pruneRedundantDashboardPackage } from "../src/bootstrap/dashboard-settings.ts";

describe("pruneRedundantDashboardPackage", () => {
  const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), "hotmilk-dashboard-settings-"));

  afterEach(() => {
    fs.rmSync(tmpHome, { recursive: true, force: true });
  });

  function writeSettings(packages: string[]): void {
    const dir = path.join(tmpHome, ".pi", "agent");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, "settings.json"),
      `${JSON.stringify({ packages }, null, 2)}\n`,
      "utf-8",
    );
  }

  it("removes standalone dashboard extension when hotmilk is active", () => {
    const dashboardExt = path.join(
      tmpHome,
      "node_modules",
      "@blackbelt-technology",
      "pi-agent-dashboard",
      "packages",
      "extension",
    );
    fs.mkdirSync(dashboardExt, { recursive: true });
    fs.writeFileSync(
      path.join(dashboardExt, "package.json"),
      JSON.stringify({ name: "@blackbelt-technology/pi-dashboard-extension" }),
      "utf-8",
    );

    writeSettings(["hotmilk", dashboardExt]);
    expect(pruneRedundantDashboardPackage({ homedir: tmpHome })).toBe(true);

    const settings = JSON.parse(
      fs.readFileSync(path.join(tmpHome, ".pi", "agent", "settings.json"), "utf-8"),
    ) as { packages: string[] };
    expect(settings.packages).toEqual(["hotmilk"]);
  });

  it("no-ops when hotmilk is not listed", () => {
    const dashboardExt = path.join(tmpHome, "extension");
    fs.mkdirSync(dashboardExt, { recursive: true });
    fs.writeFileSync(
      path.join(dashboardExt, "package.json"),
      JSON.stringify({ name: "@blackbelt-technology/pi-dashboard-extension" }),
      "utf-8",
    );

    writeSettings([dashboardExt]);
    expect(pruneRedundantDashboardPackage({ homedir: tmpHome })).toBe(false);
  });
});
