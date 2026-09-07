/** MCP config cleanup for duplicate context-mode server entries. */

import { getAgentDir } from "@earendil-works/pi-coding-agent";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { formatCaughtError, isJsonObject, parseJsonValue } from "../bootstrap/json.ts";

const CONTEXT_MODE_MCP_SERVER_ID = "context-mode";

export type PruneMcpResult = {
  pruned: boolean;
  path: string;
  error?: string;
};

/**
 * Remove the legacy `context-mode` MCP server entry from a given `mcp.json`.
 *
 * Context-mode exposes `ctx_*` through its own extension bridge, so a seeded
 * MCP server for it would duplicate functionality.
 *
 * @param mcpJsonPath - path to the MCP config file
 * @returns prune result, with `error` set on filesystem failure
 */
export function pruneContextModeFromMcpJsonAt(mcpJsonPath: string): PruneMcpResult {
  if (!existsSync(mcpJsonPath)) {
    return { pruned: false, path: mcpJsonPath };
  }

  try {
    const parsed = parseJsonValue(readFileSync(mcpJsonPath, "utf8"));
    if (!isJsonObject(parsed) || !isJsonObject(parsed.mcpServers)) {
      return { pruned: false, path: mcpJsonPath };
    }
    if (parsed.mcpServers[CONTEXT_MODE_MCP_SERVER_ID] === undefined) {
      return { pruned: false, path: mcpJsonPath };
    }
    const mcpServers = { ...parsed.mcpServers };
    delete mcpServers[CONTEXT_MODE_MCP_SERVER_ID];
    const next = { ...parsed, mcpServers };
    writeFileSync(mcpJsonPath, `${JSON.stringify(next, null, 2)}\n`, "utf8");
    return { pruned: true, path: mcpJsonPath };
  } catch (error) {
    return {
      pruned: false,
      path: mcpJsonPath,
      error: formatCaughtError(error),
    };
  }
}

/**
 * Prune legacy `context-mode` MCP server entry from the agent `mcp.json`.
 *
 * @returns prune result
 */
export function pruneContextModeMcpServerFromAgentConfig(): PruneMcpResult {
  return pruneContextModeFromMcpJsonAt(join(getAgentDir(), "mcp.json"));
}
