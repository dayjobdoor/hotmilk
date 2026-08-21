import { readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { pruneContextModeFromMcpJsonAt } from "../src/config/mcp.ts";
import { isJsonObject, parseJsonValue, type JsonObject } from "../src/bootstrap/json.ts";
import { makeTempDir } from "./fixtures/tmp.ts";

function tempMcpJson(initial: JsonObject): string {
  const dir = makeTempDir("hotmilk-mcp-");
  const path = join(dir, "mcp.json");
  writeFileSync(path, JSON.stringify(initial, null, 2), "utf8");
  return path;
}

describe("pruneContextModeFromMcpJsonAt", () => {
  it("removes context-mode server entry", () => {
    const path = tempMcpJson({
      mcpServers: {
        "context-mode": { command: "context-mode" },
        other: { command: "other" },
      },
    });

    const result = pruneContextModeFromMcpJsonAt(path);
    expect(result.pruned).toBe(true);
    expect(result.path).toBe(path);
    expect(result.error).toBeUndefined();
    const parsed = parseJsonValue(readFileSync(path, "utf8"));
    if (!isJsonObject(parsed) || !isJsonObject(parsed.mcpServers)) {
      throw new Error("expected mcp servers object");
    }
    expect(parsed.mcpServers["context-mode"]).toBeUndefined();
    expect(parsed.mcpServers.other).toEqual({ command: "other" });
  });

  it("returns false when context-mode is absent", () => {
    const path = tempMcpJson({ mcpServers: {} });
    const result = pruneContextModeFromMcpJsonAt(path);
    expect(result.pruned).toBe(false);
    expect(result.path).toBe(path);
    expect(result.error).toBeUndefined();
  });

  it("returns false when the MCP file is missing", () => {
    const path = join(tmpdir(), "hotmilk-mcp-missing", "mcp.json");
    const result = pruneContextModeFromMcpJsonAt(path);

    expect(result).toEqual({ pruned: false, path });
  });

  it("returns error for invalid JSON instead of throwing", () => {
    const dir = makeTempDir("hotmilk-mcp-bad-");
    const path = join(dir, "mcp.json");
    writeFileSync(path, "not json", "utf8");

    const result = pruneContextModeFromMcpJsonAt(path);

    expect(result.pruned).toBe(false);
    expect(result.error).toEqual(expect.any(String));
  });
});
