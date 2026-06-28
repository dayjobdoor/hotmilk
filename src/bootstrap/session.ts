import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { applyContextStackOnSessionStart } from "./context-stack.ts";
import { detectGlobalBundledExtensionSkips } from "./global-extension-sources.ts";
import { seedAgentMcpJsonIfMissing } from "../config/mcp.ts";
import { AGENT_HOTMILK_CONFIG_LABEL, seedHotmilkConfigIfMissing } from "../config/hotmilk.ts";
import type { HotmilkRuntime } from "../config/runtime.ts";
import { setupHotmilkFooter } from "../ui/footer.ts";
import {
  CAVEMAN_JA_CONFLICT_MESSAGE,
  seedPersonaFromDefaults,
  shouldWarnCavemanJaConflict,
} from "./defaults.ts";

const HOTMILK_SEEDED_MESSAGE = `Created ${AGENT_HOTMILK_CONFIG_LABEL} (toggle bundled extensions with /mode, then /reload).`;
const HOTMILK_PARSE_ERROR_MESSAGE = (path: string, error: string): string =>
  `Failed to parse ${path}: ${error}. Using default extension toggles.`;
const MCP_SEEDED_MESSAGE = (path: string): string =>
  `Created ${path} from hotmilk MCP template (add servers for pi-mcp-adapter; context-mode uses the extension bridge).`;

function formatProjectTrustSkipMessage(
  skips: HotmilkRuntime["globalExtensionSkips"],
): string | undefined {
  if (skips.length === 0) {
    return undefined;
  }
  const rows = skips.map((skip) => `${skip.id}: project ${skip.packageName}`).join("\n");
  return `Project settings also provide bundled packages (run /reload to dedupe):\n${rows}`;
}

function detectProjectOnlyBundledSkips(cwd: string): HotmilkRuntime["globalExtensionSkips"] {
  const globalOnly = detectGlobalBundledExtensionSkips({ cwd, includeProjectSettings: false });
  const withProject = detectGlobalBundledExtensionSkips({ cwd, includeProjectSettings: true });
  const globalIds = new Set(globalOnly.map((skip) => skip.id));
  return withProject.filter((skip) => !globalIds.has(skip.id));
}

function formatGlobalExtensionSkipsMessage(
  skips: HotmilkRuntime["globalExtensionSkips"],
): string | undefined {
  if (skips.length === 0) {
    return undefined;
  }
  const rows = skips.map((skip) => `${skip.id}: global ${skip.packageName}`).join("\n");
  return `Bundled extensions skipped (Pi settings already provide the package):\n${rows}`;
}

export function registerSessionHandlers(pi: ExtensionAPI, runtime: HotmilkRuntime): void {
  const termProgram = process.env.TERM_PROGRAM ?? "none";

  pi.on("session_start", (_event, ctx) => {
    const uiNotify = (message: string, level: "info" | "warning") => ctx.ui.notify(message, level);

    setupHotmilkFooter(ctx, termProgram);

    const hotmilkSeed = seedHotmilkConfigIfMissing();
    if (hotmilkSeed.seeded) {
      uiNotify(HOTMILK_SEEDED_MESSAGE, "info");
    }

    if (runtime.configError) {
      uiNotify(HOTMILK_PARSE_ERROR_MESSAGE(runtime.configPath, runtime.configError), "warning");
    }

    if (runtime.extensionToggles["gentle-ai"] && ctx.isProjectTrusted()) {
      seedPersonaFromDefaults(ctx.cwd, runtime.defaults);
    }

    applyContextStackOnSessionStart(runtime, uiNotify);

    const globalSkipMessage = formatGlobalExtensionSkipsMessage(runtime.globalExtensionSkips);
    if (globalSkipMessage) {
      uiNotify(globalSkipMessage, "info");
    }

    if (ctx.isProjectTrusted()) {
      const projectSkipMessage = formatProjectTrustSkipMessage(
        detectProjectOnlyBundledSkips(ctx.cwd),
      );
      if (projectSkipMessage) {
        uiNotify(projectSkipMessage, "warning");
      }
    }

    if (shouldWarnCavemanJaConflict(runtime.extensionToggles.caveman, runtime.defaults.language)) {
      uiNotify(CAVEMAN_JA_CONFLICT_MESSAGE, "warning");
    }

    if (runtime.mcp.seedOnStart) {
      const mcpSeed = seedAgentMcpJsonIfMissing();
      if (mcpSeed.seeded) {
        uiNotify(MCP_SEEDED_MESSAGE(mcpSeed.path), "info");
      }
    }
  });
}
