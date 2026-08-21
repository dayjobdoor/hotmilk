/** Direct `/subagents-doctor` command registration for pi-subagents-j0k3r. */

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { bundledImportUrl, resolveBundledModule } from "./resolve-bundled.ts";

/** Public bundled entry used by the j0k3r subagent extension. */
export const PI_SUBAGENTS_MODULE = "pi-subagents-j0k3r/index.ts";

function status(value: string): string {
  return fs.existsSync(value) ? "ok" : "missing";
}

export function buildSubagentsDoctorReport(cwd: string, sessionId: string | null): string {
  const globalDir = process.env.PI_CODING_AGENT_DIR ?? path.join(os.homedir(), ".pi", "agent");
  const projectAgents = path.join(cwd, ".pi", "agents");
  const projectSubagents = path.join(cwd, ".pi", "subagents");
  const config = path.join(globalDir, "subagents.json");
  const modulePath = resolveBundledModule(PI_SUBAGENTS_MODULE);

  return [
    "Subagents doctor report",
    "",
    `runtime: pi-subagents-j0k3r (${modulePath})`,
    `config: ${config} (${status(config)})`,
    `global agents: ${path.join(globalDir, "agents")} (${status(path.join(globalDir, "agents"))})`,
    `project agents: ${projectAgents} (${status(projectAgents)})`,
    `project subagents: ${projectSubagents} (${status(projectSubagents)})`,
    `session: ${sessionId ?? "unavailable"}`,
    `loader: ${bundledImportUrl(PI_SUBAGENTS_MODULE)}`,
  ].join("\n");
}

/** Register `/subagents-doctor` without relying on private upstream modules. */
export async function registerSubagentsDoctorCommand(pi: ExtensionAPI): Promise<void> {
  pi.registerCommand("subagents-doctor", {
    description: "Show subagent diagnostics",
    handler: async (_args, ctx: ExtensionContext) => {
      let sessionId: string | null = null;
      try {
        sessionId = ctx.sessionManager.getSessionId();
      } catch {
        // Session metadata is optional in diagnostics.
      }
      pi.sendMessage({
        customType: "hotmilk-subagents-doctor",
        content: buildSubagentsDoctorReport(ctx.cwd, sessionId),
        display: true,
      });
    },
  });
}
