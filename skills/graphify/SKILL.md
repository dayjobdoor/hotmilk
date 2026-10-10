---
name: graphify
description: Answer codebase architecture and relationship questions from the graphify knowledge graph instead of grepping raw files, and keep that graph fresh. Use for "how does X connect to Y", "what depends on Z", "where does this flow go", architecture overviews, or when graphify-out/ exists or a stale-graph warning appeared. Needs the hotmilk `graphify` row on (graphify_* tools) and the graphify CLI on PATH. Not for exact-symbol lookups or edits.
---

# Graphify

The graph is a map, not the territory. Use it to find where to read; confirm
in the source before you claim or change anything.

## Pick the tool

| Question                                               | Tool                                                                  |
| ------------------------------------------------------ | --------------------------------------------------------------------- |
| "How does the codebase handle X?", overview of an area | `graphify_query` (raise `budget` only when the subgraph is cut short) |
| "How is A connected to B?"                             | `graphify_path`                                                       |
| "What is X and what touches it?"                       | `graphify_explain`                                                    |
| Exact symbol, string, or file                          | not graphify: grep/LSP                                                |

## Freshness

1. No `graphify-out/graph.json`: run `graphify_build` once, then query.
2. `graphify-out/needs_update` exists, or session start warned "Graph may be
   stale", or you changed code this session: run `graphify_update` before
   relying on the changed area. It is AST-only and costs no model calls.
3. Never answer about code you just edited from a graph built before the edit.

## Output

Answer with the graph's nodes and edges named, then the file paths you
verified (`path:line`). Mark anything not checked in source as `[from graph]`.
Graph empty or the area missing: say `not in graph`, fall back to reading
source, and do not invent edges.

## Boundaries

Reads only; builds or updates `graphify-out/` and nothing else. Without the
`graphify` row or the CLI, say which is missing and use grep/LSP instead.
Scope exclusions live in `.graphifyignore`.
