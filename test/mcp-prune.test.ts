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

    expect(pruneContextModeFromMcpJsonAt(path)).toBe(true);
    const parsed = JSON.parse(readFileSync(path, "utf8"));
    expect(parsed.mcpServers["context-mode"]).toBeUndefined();
    expect(parsed.mcpServers.other).toEqual({ command: "other" });
  });

  it("returns false when context-mode is absent", () => {
    const path = tempMcpJson({ mcpServers: {} });
    expect(pruneContextModeFromMcpJsonAt(path)).toBe(false);
  });
});
