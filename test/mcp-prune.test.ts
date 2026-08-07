import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { pruneContextModeFromMcpJsonAt } from "../src/config/mcp.ts";
const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

function tempMcpJson(initial: object): string {
  const dir = mkdtempSync(join(tmpdir(), "hotmilk-mcp-"));
  tempDirs.push(dir);
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

  it("returns false when the MCP file is missing", () => {
    const path = join(tmpdir(), "hotmilk-mcp-missing", "mcp.json");
    const result = pruneContextModeFromMcpJsonAt(path);

    expect(result).toEqual({ pruned: false, path });
  });

  it("returns error for invalid JSON instead of throwing", () => {
    const dir = mkdtempSync(join(tmpdir(), "hotmilk-mcp-bad-"));
    tempDirs.push(dir);
    const path = join(dir, "mcp.json");
    writeFileSync(path, "not json", "utf8");

    const result = pruneContextModeFromMcpJsonAt(path);

    expect(result.pruned).toBe(false);
    expect(result.error).toEqual(expect.any(String));
  });
});
