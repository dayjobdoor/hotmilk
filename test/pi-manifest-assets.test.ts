import { existsSync } from "node:fs";
import { describe, expect, it } from "vite-plus/test";
import { PACKAGE_JSON, repoPath } from "./fixtures/manifest.ts";

function expectPiAssetPathsExist(label: string, paths: string[] | undefined): void {
  expect(paths, `${label} must be declared in package.json → pi`).toBeDefined();
  expect(paths!.length, `${label} must list at least one path`).toBeGreaterThan(0);
  for (const relative of paths!) {
    expect(existsSync(repoPath(relative)), `${label}: ${relative}`).toBe(true);
  }
}

describe("package.json pi manifest assets", () => {
  it("lists only the hotmilk extension entrypoint", () => {
    expect(PACKAGE_JSON.pi?.extensions).toEqual(["./src/index.ts"]);
    expect(existsSync(repoPath("./src/index.ts"))).toBe(true);
  });

  it("resolves every pi.prompts path on disk", () => {
    expectPiAssetPathsExist("pi.prompts", PACKAGE_JSON.pi?.prompts);
  });

  it("resolves every pi.skills path on disk", () => {
    expectPiAssetPathsExist("pi.skills", PACKAGE_JSON.pi?.skills);
  });

  it("resolves every pi.themes path on disk", () => {
    expectPiAssetPathsExist("pi.themes", PACKAGE_JSON.pi?.themes);
  });

  it("ships gentle-pi orchestration skills after the gentle-pi dependency", () => {
    expect(existsSync(repoPath("node_modules/gentle-pi/skills/gentle-ai/SKILL.md"))).toBe(true);
    expect(existsSync(repoPath("node_modules/gentle-pi/extensions/gentle-ai.ts"))).toBe(true);
  });
});
