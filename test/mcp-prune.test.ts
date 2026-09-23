import { existsSync, readFileSync, writeFileSync } from "node:fs";

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
  it("removes only the context-mode entry and no-ops otherwise", () => {
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

    // Without a context-mode entry the file is left untouched.
    const withoutEntry = tempMcpJson({ mcpServers: {} });
    expect(pruneContextModeFromMcpJsonAt(withoutEntry)).toEqual({
      pruned: false,
      path: withoutEntry,
    });
    expect(parseJsonValue(readFileSync(withoutEntry, "utf8"))).toEqual({ mcpServers: {} });

    const nonObjectServers = tempMcpJson({ mcpServers: [] });
    expect(pruneContextModeFromMcpJsonAt(nonObjectServers)).toEqual({
      pruned: false,
      path: nonObjectServers,
    });
    expect(parseJsonValue(readFileSync(nonObjectServers, "utf8"))).toEqual({ mcpServers: [] });

    // A valid object with no mcpServers key at all is left untouched.
    const noServersKey = tempMcpJson({});
    expect(pruneContextModeFromMcpJsonAt(noServersKey)).toEqual({
      pruned: false,
      path: noServersKey,
    });
    expect(parseJsonValue(readFileSync(noServersKey, "utf8"))).toEqual({});

    const missingPath = join(makeTempDir("hotmilk-mcp-missing-"), "mcp.json");
    expect(pruneContextModeFromMcpJsonAt(missingPath)).toEqual({
      pruned: false,
      path: missingPath,
    });
    expect(existsSync(missingPath)).toBe(false);
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
