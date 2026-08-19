# Shazam routing (execute-time structure)

**Load when:** `extensions.shazam: true`, editing shared modules, or user asks for impact analysis / post-edit LSP verify.  
**Do not load when:** Phase 0 graph recon only, plan routing, or `extensions.shazam: false`.

Canonical user doc: [README § Workflow routing](../../../README.md#workflow-routing).

## Role (not graph-wiki)

| Layer             | Tool                       | When                                                           |
| ----------------- | -------------------------- | -------------------------------------------------------------- |
| **Recon map**     | graphify (`graphify-out/`) | Phase 0 — persistent architecture, cross-module queries        |
| **Execute guard** | pi-shazam (`shazam_*`)     | Phase 4 — impact before edit, verify after edit, symbol lookup |
| **Corpus / logs** | context-mode (`ctx_*`)     | Large outputs — not code structure                             |
| **TDD loop**      | pi-red-green (`/tdd`)      | Test-first workflow — pairs with `shazam_verify` after edits   |

**Do not treat shazam as graphify replacement.** graphify answers "how does the system relate?"; shazam answers "what breaks if I change this symbol?" and "did LSP pass after the edit?". Prefer **graphify** for recon; shazam is execute-time only.

## Coexistence matrix

| Pair                            | Relationship                                                                              |
| ------------------------------- | ----------------------------------------------------------------------------------------- |
| graphify + shazam               | **Recommended** — graphify recon first; shazam during execute                             |
| shazam + red-green              | **Complementary** — TDD drives tests; `shazam_verify` catches type/lint/format            |
| shazam + context-mode           | **Non-conflicting** — different tool channels                                             |
| shazam + pi-lens (if installed) | **Overlap** on LSP/lint — pick one primary verify path per task                           |
| shazam MCP + Pi extension       | **Pick one** — bundled path is Pi extension; do not duplicate MCP server for same session |

## Pioneer phase map

```text
Phase 0  → graphify (GRAPH_REPORT.md / graph query)
Phase 4  → before shared-module edit: shazam_impact
           after edit: shazam_verify (+ bun run test per AGENTS.md)
           optional: shazam_changes when reviewing git diff risk
```

Skip shazam when the task is docs-only, config-only with no LSP, or a one-line typo with no blast radius.

## Prerequisites

- **LSP servers** for the language (e.g. `typescript-language-server`, `pyright`, `gopls`) — verify quality depends on them.
- **Windows:** upstream notes tree-sitter native limits — document in README; default off on Windows if unsupported.
- **Session start hook:** shazam may inject overview into system prompt — large repos can add latency; keep toggle off when not needed.

## Anti-patterns

| Do not                                                           | Why                                            | Do instead                           |
| ---------------------------------------------------------------- | ---------------------------------------------- | ------------------------------------ |
| `shazam_overview` instead of graphify for architecture questions | No persistent graph; misses cross-session wiki | Phase 0 graphify                     |
| Skip `shazam_impact` before wide refactor                        | Hidden blast radius                            | impact → edit → verify               |
| Trust `shazam_verify` PASS without tests                         | LSP green ≠ behavior correct                   | tests + verify                       |
| graphify query + shazam lookup for same question in one turn     | Token waste                                    | Pick the layer that fits             |
| Enable shazam MCP and bundled extension together                 | Duplicate tools                                | Pi extension via hotmilk toggle only |

## Fallback when toggle off

Say shazam unavailable. Use graphify for structure, `read`/`grep` for local symbols, and project test/lint commands in `verify:`.