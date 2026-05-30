import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { applyContextStackOnSessionStart } from "./context-stack.ts";
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

    if (runtime.extensionToggles["gentle-ai"]) {
      seedPersonaFromDefaults(ctx.cwd, runtime.defaults);
    }

    applyContextStackOnSessionStart(runtime, uiNotify);

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
