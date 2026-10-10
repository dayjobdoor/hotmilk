---
name: graphify
description: Answer codebase architecture and relationship questions from the graphify knowledge graph instead of grepping raw files, and keep that graph fresh. Use for "how does X connect to Y", "what in this codebase depends on Z", "where does this flow go", architecture overviews, or when graphify-out/ exists or a stale-graph warning appeared. Needs the hotmilk `graphify` row on (graphify_* tools) and the graphify CLI on PATH. Not for exact-symbol lookups, package-manager dependency questions, or edits.
---

# Graphify

The graph is a map, not the territory. Use it to find where to read; confirm
in the source before you claim or change anything.

## Pick the tool

| Question                                               | Tool                                                                   |
| ------------------------------------------------------ | ---------------------------------------------------------------------- |
| "How does the codebase handle X?", overview of an area | `graphify_query` (raise `budget` only when a node you need is missing) |
| "How is A connected to B?"                             | `graphify_path` with `undirected: true` (directed paths miss often)    |
| "What is X and what touches it?"                       | `graphify_explain`                                                     |
| Exact symbol, string, or file                          | not graphify: grep/LSP                                                 |

## Freshness

1. No `graphify-out/graph.json`: run `graphify_build` once, then query. It
   shares the 60 s CLI timeout; if the result is a CLI error (often prefixed
   `Error running graphify`) or `graph.json` is still missing, run `graphify .`
   in the shell.
2. `graphify-out/needs_update` exists, session start warned "Graph may be
   stale" or "graph is N commits stale", or you changed code this session:
   run `graphify_update` before relying on the changed area (AST-only, no
   model calls).
3. Never answer about code you just edited from a graph built before the edit.

## Output

Answer with the graph's nodes and edges named, then the file paths you
verified (`path:line`). Mark anything not checked in source as `[from graph]`;
never state an edge as fact before opening both ends, because node names are
fuzzy-matched and can resolve to the wrong file.
Graph empty or the area missing: say `not in graph`, fall back to reading
source, and do not invent edges.

```text
parseConfig → loadSettings (calls) — src/config.ts:42, src/settings.ts:10
loadSettings → readJson (calls) [from graph]
```

## Boundaries

Writes only `graphify-out/`, through `graphify_build` / `graphify_update` or
`graphify .`. No `graphify_*` tools: run `command -v graphify` to tell a
missing CLI from the row being off, say which, and use grep/LSP instead.
Scope exclusions live in `.graphifyignore`.
