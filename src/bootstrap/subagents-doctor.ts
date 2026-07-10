/**
 * Direct `/subagents-doctor` command registration.
 *
 * Bypasses the upstream slash-event bridge so the doctor report works even
 * when `state.lastUiContext` is unset after `/reload`.
 */

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { bundledImportUrl } from "./resolve-bundled.ts";

function ensureAccessibleDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
  fs.accessSync(dirPath, fs.constants.R_OK | fs.constants.W_OK);
}

/** pi-subagents creates async/results on init but not chain-runs until the first /chain. */
async function ensureChainRunsDir(): Promise<void> {
  const types = (await import(
    bundledImportUrl("pi-subagents/src/shared/types.ts")
  )) as typeof import("pi-subagents/src/shared/types.ts");
  ensureAccessibleDir(types.CHAIN_RUNS_DIR);
}

type DoctorModule = typeof import("pi-subagents/src/extension/doctor.ts");
type ConfigModule = typeof import("pi-subagents/src/extension/config.ts");
type IntercomModule = typeof import("pi-subagents/src/intercom/intercom-bridge.ts");
type SubagentState = import("pi-subagents/src/shared/types.ts").SubagentState;

function expandTilde(value: string): string {
  return value.startsWith("~/") ? path.join(os.homedir(), value.slice(2)) : value;
}

function buildDirectDoctorReport(
  pi: ExtensionAPI,
  ctx: ExtensionContext,
  deps: {
    buildDoctorReport: DoctorModule["buildDoctorReport"];
    loadConfig: ConfigModule["loadConfig"];
    resolveIntercomSessionTarget: IntercomModule["resolveIntercomSessionTarget"];
  },
): string {
  const config = deps.loadConfig();
  let currentSessionFile: string | null = null;
  let currentSessionId: string | null = null;
  let sessionError: string | undefined;

  try {
    currentSessionFile = ctx.sessionManager.getSessionFile() ?? null;
    currentSessionId = ctx.sessionManager.getSessionId();
  } catch (error) {
    sessionError = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  }

  let orchestratorTarget: string | undefined;
  try {
    orchestratorTarget = deps.resolveIntercomSessionTarget(
      pi.getSessionName(),
      ctx.sessionManager.getSessionId(),
    );
  } catch {
    // Intercom target is optional for the report.
  }

  return deps.buildDoctorReport({
    cwd: ctx.cwd,
    config,
    state: {
      baseCwd: ctx.cwd,
      currentSessionId,
    } as SubagentState,
    currentSessionFile,
    currentSessionId,
    orchestratorTarget,
    sessionError,
    expandTilde,
  });
}

/**
 * pi-subagents registers `/subagents-doctor` through the slash event bridge, which
 * reads `state.lastUiContext` instead of the command handler's `ctx`. After `/reload`
 * that context can be unset while the command still runs — override with a direct report.
 */
/**
 * Register the `/subagents-doctor` Pi command with a direct report builder.
 *
 * @param pi - Pi extension API
 */
export async function registerSubagentsDoctorCommand(pi: ExtensionAPI): Promise<void> {
  await ensureChainRunsDir();

  const [doctorMod, configMod, intercomMod] = await Promise.all([
    import(bundledImportUrl("pi-subagents/src/extension/doctor.ts")) as Promise<DoctorModule>,
    import(bundledImportUrl("pi-subagents/src/extension/config.ts")) as Promise<ConfigModule>,
    import(
      bundledImportUrl("pi-subagents/src/intercom/intercom-bridge.ts")
    ) as Promise<IntercomModule>,
  ]);

  const deps = {
    buildDoctorReport: doctorMod.buildDoctorReport,
    loadConfig: configMod.loadConfig,
    resolveIntercomSessionTarget: intercomMod.resolveIntercomSessionTarget,
  };

  pi.registerCommand("subagents-doctor", {
    description: "Show subagent diagnostics",
    handler: async (_args, ctx) => {
      await ensureChainRunsDir();
      const report = buildDirectDoctorReport(pi, ctx, deps);
      pi.sendMessage({
        customType: "hotmilk-subagents-doctor",
        content: report,
        display: true,
      });
    },
  });
}
