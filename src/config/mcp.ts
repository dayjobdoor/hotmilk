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
import {
  formatCaughtError,
  isJsonObject,
  parseJsonValue,
  type JsonObject,
  type JsonValue,
} from "../json.ts";

const PACKAGE_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const MCP_TEMPLATE_PATH = join(PACKAGE_ROOT, "mcp.json");
const CONTEXT_MODE_MCP_SERVER_ID = "context-mode";

type MutableJsonObject = { [key: string]: JsonValue };

export type SeedMcpResult = {
  seeded: boolean;
  path: string;
};

export type PruneMcpResult = {
  pruned: boolean;
  path: string;
  error?: string;
};

function toMutableJsonObject(value: JsonObject) {
  const next: MutableJsonObject = {};
  for (const key of Object.keys(value)) {
    next[key] = value[key];
  }
  return next;
}

/**
 * Copy the bundled `mcp.json` template into the agent directory when absent.
 *
 * @returns seed result
 */
export function seedAgentMcpJsonIfMissing(): SeedMcpResult {
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
    const mcpServers = toMutableJsonObject(parsed.mcpServers);
    delete mcpServers[CONTEXT_MODE_MCP_SERVER_ID];
    const next = toMutableJsonObject(parsed);
    next.mcpServers = mcpServers;
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
