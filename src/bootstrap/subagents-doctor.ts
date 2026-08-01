/**
 * Direct `/subagents-doctor` command registration.
 *
 * Bypasses the upstream slash-event bridge so the doctor report works even
 * when `state.lastUiContext` is unset after `/reload`.
 *
 * Types are local (not `import("pi-subagents/src/...")`) because pi-subagents
 * package `exports` only expose `.`, `./background-work`, and `./delegation`.
 * Runtime still loads deep modules via {@link bundledImportUrl}.
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

type SharedTypesModule = {
  CHAIN_RUNS_DIR: string;
};

type DoctorModule = {
  buildDoctorReport: (input: {
    cwd: string;
    config: unknown;
    state: { baseCwd: string; currentSessionId: string | null };
    currentSessionFile: string | null;
    currentSessionId: string | null;
    orchestratorTarget: string | undefined;
    sessionError: string | undefined;
    expandTilde: (value: string) => string;
  }) => string;
};

type ConfigModule = {
  loadConfig: () => unknown;
};

type IntercomModule = {
  resolveIntercomSessionTarget: (sessionName: string | undefined, sessionId: string) => string;
};

/** pi-subagents creates async/results on init but not chain-runs until the first /chain. */
async function ensureChainRunsDir(): Promise<void> {
  const types = (await import(
    bundledImportUrl("pi-subagents/src/shared/types.ts")
  )) as SharedTypesModule;
  ensureAccessibleDir(types.CHAIN_RUNS_DIR);
}

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
    },
    currentSessionFile,
    currentSessionId,
    orchestratorTarget,
    sessionError,
    expandTilde,
  });
}

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
