import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { applyContextStackOnSessionStart } from "./context-stack.ts";
import { detectGlobalBundledExtensionSkips } from "./global-extension-sources.ts";
import { hotmilkConfigDisplayPath, seedHotmilkConfigIfMissing } from "../config/hotmilk.ts";
import type { HotmilkRuntime } from "../config/runtime.ts";
import { setupHotmilkFooter } from "../ui/footer.ts";
import {
  CAVEMAN_JA_CONFLICT_MESSAGE,
  KANAGAWA_FOOTER_WARNING,
  seedPersonaFromDefaults,
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

/** Register hotmilk session-start handlers (seed config, footer, context stack, MCP). */
export function registerSessionHandlers(pi: ExtensionAPI, runtime: HotmilkRuntime): void {
  const termProgram = process.env.TERM_PROGRAM ?? "none";

  pi.on("session_start", (_event, ctx) => {
    const uiNotify = (message: string, level: "info" | "warning") => ctx.ui.notify(message, level);

    setupHotmilkFooter(ctx, termProgram);

    const hotmilkSeed = seedHotmilkConfigIfMissing();
    if (hotmilkSeed.seeded) {
      uiNotify(HOTMILK_SEEDED_MESSAGE(hotmilkConfigDisplayPath()), "info");
    }

    if (runtime.configError) {
      uiNotify(HOTMILK_PARSE_ERROR_MESSAGE(runtime.configPath, runtime.configError), "warning");
    }

    if (runtime.extensionToggles["gentle-ai"] && ctx.isProjectTrusted()) {
      seedPersonaFromDefaults(ctx.cwd, runtime.defaults);
    }

    applyContextStackOnSessionStart(runtime, uiNotify);

    const globalSkipMessage = formatExtensionSkipsMessage(
      runtime.globalExtensionSkips,
      "global",
      "Bundled extensions skipped (Pi settings already provide the package):",
    );
    if (globalSkipMessage) {
      uiNotify(globalSkipMessage, "info");
    }

    if (ctx.isProjectTrusted()) {
      const projectSkipMessage = formatExtensionSkipsMessage(
        detectProjectOnlyBundledSkips(ctx.cwd),
        "project",
        "Project settings also provide bundled packages (run /reload to dedupe):",
      );
      if (projectSkipMessage) {
        uiNotify(projectSkipMessage, "warning");
      }
    }

    if (shouldWarnCavemanJaConflict(runtime.extensionToggles.caveman, runtime.defaults.language)) {
      uiNotify(CAVEMAN_JA_CONFLICT_MESSAGE, "warning");
    }

    if (runtime.extensionToggles.kanagawa) {
      uiNotify(KANAGAWA_FOOTER_WARNING, "warning");
    }
  });
}
