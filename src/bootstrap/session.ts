import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import {
  pruneContextModeMcpServerFromAgentConfig,
  seedAgentMcpJsonIfMissing,
} from "../config/mcp.ts";
import { AGENT_HOTMILK_CONFIG_LABEL, seedHotmilkConfigIfMissing } from "../config/hotmilk.ts";
import type { HotmilkRuntime } from "../config/runtime.ts";
import { setupHotmilkFooter } from "../ui/footer.ts";
import { HOTMILK_LOGO } from "../ui/logo.ts";
import { seedPersonaFromDefaults } from "./defaults.ts";

const HOTMILK_SEEDED_MESSAGE = `Created ${AGENT_HOTMILK_CONFIG_LABEL} (toggle bundled extensions with /mode, then /reload).`;
const HOTMILK_PARSE_ERROR_MESSAGE = (path: string, error: string): string =>
  `Failed to parse ${path}: ${error}. Using default extension toggles.`;
const MCP_SEEDED_MESSAGE = (path: string): string =>
  `Created ${path} from hotmilk MCP template (add servers for pi-mcp-adapter; context-mode uses the extension bridge).`;
const MCP_PRUNED_CONTEXT_MODE_MESSAGE = (path: string): string =>
  `Removed duplicate context-mode entry from ${path}. Use context-mode extension tools (ctx_*), not MCP adapter, unless mcp-adapter is enabled.`;

export function registerSessionHandlers(pi: ExtensionAPI, runtime: HotmilkRuntime): void {
  const termProgram = process.env.TERM_PROGRAM ?? "none";

  pi.on("session_start", (_event, ctx) => {
    setupHotmilkFooter(ctx, termProgram);

    ctx.ui.notify(`\`\`\`text\n${HOTMILK_LOGO}\n\`\`\``, "info");
    const hotmilkSeed = seedHotmilkConfigIfMissing();
    if (hotmilkSeed.seeded) {
      ctx.ui.notify(HOTMILK_SEEDED_MESSAGE, "info");
    }

    if (runtime.configError) {
      ctx.ui.notify(
        HOTMILK_PARSE_ERROR_MESSAGE(runtime.configPath, runtime.configError),
        "warning",
      );
    }

    if (runtime.extensionToggles["gentle-ai"]) {
      seedPersonaFromDefaults(ctx.cwd, runtime.defaults);
    }

    const useContextModeExtension =
      runtime.extensionToggles["context-mode"] && !runtime.extensionToggles["mcp-adapter"];
    if (useContextModeExtension) {
      const mcpPrune = pruneContextModeMcpServerFromAgentConfig();
      if (mcpPrune.pruned) {
        ctx.ui.notify(MCP_PRUNED_CONTEXT_MODE_MESSAGE(mcpPrune.path), "info");
      }
    }

    if (runtime.mcp.seedOnStart) {
      const mcpSeed = seedAgentMcpJsonIfMissing();
      if (mcpSeed.seeded) {
        ctx.ui.notify(MCP_SEEDED_MESSAGE(mcpSeed.path), "info");
      }
    }
  });
}
