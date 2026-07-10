/**
 * MCP config seeding and legacy context-mode cleanup.
 *
 * Seeds the agent `mcp.json` from the bundled template and prunes duplicate
 * `context-mode` MCP server entries because context-mode exposes `ctx_*`
 * through its own extension bridge.
 */

import { getAgentDir } from "@earendil-works/pi-coding-agent";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PACKAGE_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const MCP_TEMPLATE_PATH = join(PACKAGE_ROOT, "mcp.json");
const CONTEXT_MODE_MCP_SERVER_ID = "context-mode";

type AgentMcpFile = {
  mcpServers?: Record<string, unknown>;
};

/**
 * Copy the bundled `mcp.json` template into the agent directory when absent.
 *
 * @returns seed result
 */
export function seedAgentMcpJsonIfMissing(): { seeded: boolean; path: string } {
  const agentMcpPath = join(getAgentDir(), "mcp.json");
  if (existsSync(agentMcpPath)) {
    return { seeded: false, path: agentMcpPath };
  }
  if (!existsSync(MCP_TEMPLATE_PATH)) {
    return { seeded: false, path: agentMcpPath };
  }
  mkdirSync(dirname(agentMcpPath), { recursive: true });
  copyFileSync(MCP_TEMPLATE_PATH, agentMcpPath);
  return { seeded: true, path: agentMcpPath };
}

/**
 * Remove the legacy `context-mode` MCP server entry from a given `mcp.json`.
 *
 * Context-mode exposes `ctx_*` through its own extension bridge, so a seeded
 * MCP server for it would duplicate functionality.
 *
 * @param mcpJsonPath - path to the MCP config file
 * @returns prune result, with `error` set on filesystem failure
 */
export function pruneContextModeFromMcpJsonAt(mcpJsonPath: string): {
  pruned: boolean;
  path: string;
  error?: string;
} {
  if (!existsSync(mcpJsonPath)) {
    return { pruned: false, path: mcpJsonPath };
  }

  try {
    const parsed = JSON.parse(readFileSync(mcpJsonPath, "utf8")) as AgentMcpFile;
    if (!parsed.mcpServers?.[CONTEXT_MODE_MCP_SERVER_ID]) {
      return { pruned: false, path: mcpJsonPath };
    }
    delete parsed.mcpServers[CONTEXT_MODE_MCP_SERVER_ID];
    writeFileSync(mcpJsonPath, `${JSON.stringify(parsed, null, 2)}\n`, "utf8");
    return { pruned: true, path: mcpJsonPath };
  } catch (error) {
    return {
      pruned: false,
      path: mcpJsonPath,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Prune legacy `context-mode` MCP server entry from the agent `mcp.json`.
 *
 * @returns prune result
 */
export function pruneContextModeMcpServerFromAgentConfig(): {
  pruned: boolean;
  path: string;
  error?: string;
} {
  return pruneContextModeFromMcpJsonAt(join(getAgentDir(), "mcp.json"));
}
