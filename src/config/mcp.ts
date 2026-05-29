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
 * Option A: context-mode extension registers ctx_* via its built-in MCP bridge.
 * A hotmilk-seeded `context-mode` MCP server duplicates that path via pi-mcp-adapter.
 */
export function pruneContextModeFromMcpJsonAt(mcpJsonPath: string): boolean {
  if (!existsSync(mcpJsonPath)) {
    return false;
  }

  try {
    const parsed = JSON.parse(readFileSync(mcpJsonPath, "utf8")) as AgentMcpFile;
    if (!parsed.mcpServers?.[CONTEXT_MODE_MCP_SERVER_ID]) {
      return false;
    }
    delete parsed.mcpServers[CONTEXT_MODE_MCP_SERVER_ID];
    writeFileSync(mcpJsonPath, `${JSON.stringify(parsed, null, 2)}\n`, "utf8");
    return true;
  } catch {
    return false;
  }
}

export function pruneContextModeMcpServerFromAgentConfig(): { pruned: boolean; path: string } {
  const agentMcpPath = join(getAgentDir(), "mcp.json");
  const pruned = pruneContextModeFromMcpJsonAt(agentMcpPath);
  return { pruned, path: agentMcpPath };
}
