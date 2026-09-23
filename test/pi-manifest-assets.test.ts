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
  it("declares only the hotmilk entrypoint and resolvable asset paths", () => {
    expect(PACKAGE_JSON.pi?.extensions).toEqual(["./src/index.ts"]);
    expect(existsSync(repoPath("./src/index.ts"))).toBe(true);

    expectPiAssetPathsExist("pi.prompts", PACKAGE_JSON.pi?.prompts);
    expectPiAssetPathsExist("pi.skills", PACKAGE_JSON.pi?.skills);
    expectPiAssetPathsExist("pi.themes", PACKAGE_JSON.pi?.themes);
  });
});
