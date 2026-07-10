import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { pruneContextModeFromMcpJsonAt } from "../src/config/mcp.ts";

function tempMcpJson(initial: object): string {
  const dir = mkdtempSync(join(tmpdir(), "hotmilk-mcp-"));
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
    const parsed = JSON.parse(readFileSync(path, "utf8"));
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

  it("returns error for invalid JSON instead of throwing", () => {
    const dir = mkdtempSync(join(tmpdir(), "hotmilk-mcp-bad-"));
    const path = join(dir, "mcp.json");
    writeFileSync(path, "not json", "utf8");

    const result = pruneContextModeFromMcpJsonAt(path);
    expect(result.pruned).toBe(false);
    expect(result.error).toBeDefined();
  });
});
