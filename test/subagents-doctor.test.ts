import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { buildSubagentsDoctorReport } from "../src/bootstrap/subagents-doctor.ts";
import { makeTempDir } from "./fixtures/tmp.ts";

describe("subagents doctor", () => {
  it("reports exact runtime, config, and project diagnostic statuses", () => {
    const globalDir = makeTempDir("hotmilk-doctor-global-");
    const cwd = makeTempDir("hotmilk-doctor-project-");
    const previousAgentDir = process.env.PI_CODING_AGENT_DIR;
    process.env.PI_CODING_AGENT_DIR = globalDir;
    mkdirSync(join(globalDir, "agents"));
    writeFileSync(join(globalDir, "subagents.json"), "{}", "utf8");

    try {
      const lines = buildSubagentsDoctorReport(cwd, "test-session").split("\n");
      const runtimeLine = lines.find((line) => line.startsWith("runtime:"));

      expect(lines).toContain("Subagents doctor report");
      expect(runtimeLine).toMatch(
        /^runtime: pi-subagents-j0k3r \(.*node_modules[/\\]pi-subagents-j0k3r[/\\]index\.ts\)$/,
      );
      expect(lines).toContain(`config: ${join(globalDir, "subagents.json")} (ok)`);
      expect(lines).toContain(`global agents: ${join(globalDir, "agents")} (ok)`);
      expect(lines).toContain(`project agents: ${join(cwd, ".pi", "agents")} (missing)`);
      expect(lines).toContain(`project subagents: ${join(cwd, ".pi", "subagents")} (missing)`);
      expect(lines).toContain("session: test-session");
      expect(lines.find((line) => line.startsWith("loader:"))).toMatch(/^loader: file:\/\//);
    } finally {
      if (previousAgentDir === undefined) delete process.env.PI_CODING_AGENT_DIR;
      else process.env.PI_CODING_AGENT_DIR = previousAgentDir;
    }
  });
});
