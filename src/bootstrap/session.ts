import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { CONFIG_DIR_NAME, type ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { detectGlobalBundledExtensionSkips } from "./global-extension-sources.ts";
import {
  hotmilkConfigDisplayPath,
  markDefaultOffNoticeSeen,
  seedHotmilkConfigIfMissing,
} from "../config/hotmilk.ts";
import { OMP_AUDITED_VERSION } from "../config/bundled-extensions.ts";
import type { HotmilkRuntime } from "../config/runtime.ts";
import { setupHotmilkFooter } from "../ui/footer.ts";
import { playHotmilkIntro } from "../ui/logo.ts";
import {
  CAVEMAN_JA_CONFLICT_MESSAGE,
  KANAGAWA_FOOTER_WARNING,
  syncPersonaFileFromDefaults,
  shouldWarnCavemanJaConflict,
} from "./defaults.ts";

/** Message shown when hotmilk config is seeded. */
const HOTMILK_SEEDED_MESSAGE = (path: string): string =>
  `Created ${path} (toggle bundled extensions with /mode, then /reload).`;
/**
 * Format error message for hotmilk config parse failures.
 *
 * @param path - config file path
 * @param error - error message
 * @returns formatted error message
 */
const HOTMILK_PARSE_ERROR_MESSAGE = (path: string, error: string): string =>
  `Failed to parse ${path}: ${error}. Using default extension toggles.`;

/** Notice when omp is the host and enabled pi-only toggles were not loaded. */
const OMP_HARNESS_SKIP_MESSAGE = (ids: readonly string[]): string =>
  `omp harness: pi-only bundled extensions skipped (not flagged omp in the registry): ${ids.join(", ")}. Run /mode to see which rows load under omp.`;

/** Notice when omp runs a release other than the one the `omp` flags were audited on. */
const OMP_UNAUDITED_VERSION_MESSAGE = (version: string): string =>
  `omp ${version} is not the audited release (${OMP_AUDITED_VERSION}); omp-flagged bundled extensions are unverified on it.`;

/** One-time notice after the 0.2.0 default flip: which formerly default-on rows are now off. */
const DEFAULT_OFF_MESSAGE = (ids: readonly string[]): string =>
  `hotmilk 0.2.0: bundled extensions are off by default now. You had no saved value for: ${ids.join(", ")}. Turn on what you use with /mode, then /reload. (Shown once.)`;

/** Notice for bundled rows that failed to load; the rest of hotmilk registered normally. */
const EXTENSION_FAILURES_MESSAGE = (failures: HotmilkRuntime["extensionFailures"]): string =>
  `Bundled extensions failed to load (turn them off with /mode, then /reload):\n${failures.map((failure) => `${failure.id}: ${failure.message}`).join("\n")}`;

/** Format an extension-skip notification. */
function formatExtensionSkipsMessage(
  skips: HotmilkRuntime["globalExtensionSkips"],
  scope: "global" | "project",
  prefix: string,
): string | undefined {
  if (skips.length === 0) {
    return undefined;
  }
  const rows = skips.map((skip) => `${skip.id}: ${scope} ${skip.packageName}`).join("\n");
  return `${prefix}\n${rows}`;
}

/**
 * Detect bundled extensions provided only by project settings.
 */
function detectProjectOnlyBundledSkips(cwd: string): HotmilkRuntime["globalExtensionSkips"] {
  const globalOnly = detectGlobalBundledExtensionSkips({ cwd, includeProjectSettings: false });
  const withProject = detectGlobalBundledExtensionSkips({ cwd, includeProjectSettings: true });
  const globalIds = new Set(globalOnly.map((skip) => skip.id));
  return withProject.filter((skip) => !globalIds.has(skip.id));
}

/** Project-local subagent definitions gentle-agents reads with no trust gate (project beats global). */
export function detectProjectAgentDefinitions(cwd: string): string[] {
  const found: string[] = [];
  for (const dir of ["agents", "subagents"]) {
    const path = join(cwd, CONFIG_DIR_NAME, dir);
    if (existsSync(path) && readdirSync(path).some((file) => file.toLowerCase().endsWith(".md"))) {
      found.push(`${CONFIG_DIR_NAME}/${dir}/`);
    }
  }
  if (existsSync(join(cwd, CONFIG_DIR_NAME, "subagents.json"))) {
    found.push(`${CONFIG_DIR_NAME}/subagents.json`);
  }
  return found;
}

const UNTRUSTED_PROJECT_AGENTS_MESSAGE = (found: readonly string[]): string =>
  `This project is not trusted but defines subagents (${found.join(", ")}). gentle-agents has no trust gate and will use them, including their tools and instructions. Review them, turn off subagents in /mode, or set GENTLE_PI_AGENTS=0.`;

/** One session-start notification. */
type Notice = { message: string; level: "info" | "warning" };

const RTK_UPDATED_MESSAGE =
  "Adjusted pi-rtk-optimizer for context-mode coexistence (mode/readCompaction). Pi auto-compaction unchanged.";
const RTK_FAILED_MESSAGE = (path: string, error: string): string =>
  `Could not sync pi-rtk-optimizer config at ${path}: ${error}. rtk runs with its own settings.`;

/** Facts the session-start handler gathers by I/O before notices are built. */
type SessionStartFacts = {
  /** Display path of a `hotmilk.json` seeded this session. */
  seededPath?: string;
  /** Bundled ids provided by project settings (empty when the project is untrusted). */
  projectSkips: HotmilkRuntime["globalExtensionSkips"];
  /** Project subagent definitions present while the project is untrusted and `subagents` is on. */
  untrustedProjectAgents?: readonly string[];
};

/** Pure: every session-start notice for this runtime and the gathered facts, in display order. */
export function sessionStartNotices(runtime: HotmilkRuntime, facts: SessionStartFacts): Notice[] {
  const notices: Notice[] = [];
  const add = (message: string | undefined, level: Notice["level"]) => {
    if (message) notices.push({ message, level });
  };
  add(facts.seededPath && HOTMILK_SEEDED_MESSAGE(facts.seededPath), "info");
  add(
    runtime.legacyDefaultsLost.length > 0
      ? DEFAULT_OFF_MESSAGE(runtime.legacyDefaultsLost)
      : undefined,
    "info",
  );
  add(
    runtime.configError && HOTMILK_PARSE_ERROR_MESSAGE(runtime.configPath, runtime.configError),
    "warning",
  );
  add(
    runtime.extensionFailures.length > 0
      ? EXTENSION_FAILURES_MESSAGE(runtime.extensionFailures)
      : undefined,
    "warning",
  );
  add(runtime.harnessSkips.length > 0 ? OMP_HARNESS_SKIP_MESSAGE(runtime.harnessSkips) : undefined, "warning");
  add(
    runtime.harness === "omp" && runtime.harnessVersion !== OMP_AUDITED_VERSION
      ? OMP_UNAUDITED_VERSION_MESSAGE(runtime.harnessVersion)
      : undefined,
    "warning",
  );
  const rtk = runtime.rtkSync;
  add(rtk?.outcome === "updated" ? RTK_UPDATED_MESSAGE : undefined, "info");
  add(rtk?.outcome === "failed" ? RTK_FAILED_MESSAGE(rtk.path, rtk.error ?? "unknown error") : undefined, "warning");
  add(
    formatExtensionSkipsMessage(
      runtime.globalExtensionSkips,
      "global",
      "Bundled extensions skipped (Pi settings already provide the package):",
    ),
    "info",
  );
  add(
    formatExtensionSkipsMessage(
      facts.projectSkips,
      "project",
      "Project settings also provide bundled packages (run /reload to dedupe):",
    ),
    "warning",
  );
  add(
    shouldWarnCavemanJaConflict(runtime.extensionToggles.caveman, runtime.defaults.language)
      ? CAVEMAN_JA_CONFLICT_MESSAGE
      : undefined,
    "warning",
  );
  add(runtime.extensionToggles.kanagawa ? KANAGAWA_FOOTER_WARNING : undefined, "warning");
  add(
    runtime.extensionToggles.subagents && facts.untrustedProjectAgents?.length
      ? UNTRUSTED_PROJECT_AGENTS_MESSAGE(facts.untrustedProjectAgents)
      : undefined,
    "warning",
  );
  return notices;
}

/** Register hotmilk session-start handlers: I/O here, notice decisions in {@link sessionStartNotices}. */
export function registerSessionHandlers(pi: ExtensionAPI, runtime: HotmilkRuntime): void {
  const termProgram = process.env.TERM_PROGRAM ?? "none";

  pi.on("session_start", (event, ctx) => {
    const uiNotify = (message: string, level: Notice["level"]) => ctx.ui.notify(message, level);

    setupHotmilkFooter(ctx, termProgram);
    if (event.reason === "startup") playHotmilkIntro(ctx);

    const trusted = ctx.isProjectTrusted();
    if (runtime.extensionToggles["gentle-ai"] && trusted) {
      syncPersonaFileFromDefaults(ctx.cwd, runtime.defaults);
    }

    const notices = sessionStartNotices(runtime, {
      seededPath: seedHotmilkConfigIfMissing().seeded ? hotmilkConfigDisplayPath() : undefined,
      projectSkips: trusted ? detectProjectOnlyBundledSkips(ctx.cwd) : [],
      untrustedProjectAgents:
        runtime.extensionToggles.subagents && !trusted ? detectProjectAgentDefinitions(ctx.cwd) : [],
    });
    for (const { message, level } of notices) uiNotify(message, level);
    // Shown once: record it only after the notices went out.
    if (runtime.legacyDefaultsLost.length > 0) markDefaultOffNoticeSeen();
  });
}
