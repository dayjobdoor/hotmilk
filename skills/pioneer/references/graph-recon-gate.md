# Graph recon gate

**Load when:** Phase 0 runs — before wide `grep` or reading many files.

## Artifact order

1. `graphify-out/wiki/index.md` — prefer for navigation when sufficient
2. `graphify-out/GRAPH_REPORT.md` — god nodes, surprising connections, suggested questions
3. `graphify-out/graph.json` — fallback for paths and communities

If `extensions.codegraph: true` instead of graphify, use CodeGraph tools (`explore` / `search` / `impact`) for Phase 0 and **do not** also query `graphify-out/` in the same turn. Prefer **one** recon map per session.

## Graph commands

Full CLI: `/skill:graphify`.

| Question type            | Command                                                 |
| ------------------------ | ------------------------------------------------------- |
| How does X relate to Y?  | `graphify query "…" --graph graphify-out/graph.json`    |
| Shortest dependency path | `graphify path "A" "B" --graph graphify-out/graph.json` |
| What is node X?          | `graphify explain "X" --graph graphify-out/graph.json`  |

## Rules

- Answer from graph output; do not invent edges or source paths.
- If the graph gives an exact path, use it; otherwise one narrow lookup, then read that file.
- If `graphify-out/needs_update` exists or code changed this session, say the graph may be stale; suggest `graphify update .` before trusting modified areas.

## When graph update fails

`graphify update .` failed, graphify unavailable, or toggle `extensions.graphify: false` after stale detection?

1. Say **"Graph stale — update failed: …"** with command + short error summary
2. Fall through to **Fallback when graph is missing** ladder — do not retry update in a loop
3. Prefer narrow reads of files changed this session over stale graph edges
4. Offer `graphify .` or enable graphify only if the user wants a fresh map

Leave the stale warning visible in chat before Phase 2+ work.

## Fallback when graph is missing

No `graphify-out/` or artifacts unreadable? Say **"Graph recon skipped: …"** with reason, then use this ladder **before** repo-wide grep:

1. `AGENTS.md` / `README.md` for the topic
2. One narrow path lookup (glob or single grep) to find the canonical file
3. Read that file only — no broad grep until steps 1–2 fail

Offer `graphify .` only if the user wants a map built first.

## Graph + grill

Use GRAPH_REPORT god nodes / surprising connections as grill fuel ("this edge implies X — is that still true?").
