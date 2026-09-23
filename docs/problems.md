# Problems

Known pitfalls and docs↔runtime drift to watch. Fixes belong in code or the owning doc; record here when the trap is easy to repeat.

## Operator traps

| Problem | Symptom | Mitigation |
| ------- | ------- | ---------- |
| **caveman + `defaults.language: ja`** | English terse rules fight Japanese language hint | Turn off caveman in `/mode`, clear language, or `/caveman off`; session warns ([DESIGN.md](../DESIGN.md)) |
| **kanagawa on** | hotmilk footer replaced | Turn off kanagawa in `/mode` for the status footer back |
| **Toggles without `/reload`** | Extensions still old after `/mode` save | Run `/reload` after changing toggles |
| **Global `npm:pi-btw` in Pi settings** | hotmilk BTW shim skipped (dedupe) | Prefer bundled hotmilk BTW for prompt/tool patches |
| **Stale graphify index** | `graphify-out/needs_update` present | Run `graphify update .` ([architecture.md](architecture.md)) |

## Install / peers

| Problem | Symptom | Mitigation |
| ------- | ------- | ---------- |
| **Narrow bundled peer ranges** | npm `ERESOLVE` on install | Use repo `.npmrc` `legacy-peer-deps=true`; see README peers section |
| **Nested @earendil-works copies** | Multiple Pi versions under `node_modules` | `third-party-risk.test.ts` tracks drift; bump floors when upstream dedupes |

## Development traps

| Problem | Symptom | Mitigation |
| ------- | ------- | ---------- |
| **context-mode MCP + bundled context-mode** | Duplicate `ctx_*` servers | hotmilk prunes `context-mode` from `mcp.json`; do not re-add manually |
| **Adding toggled bundle to `pi.extensions`** | Double load or bypass lazy registry | Only `src/index.ts` in `pi.extensions` ([architecture.md](architecture.md)) |
| **Repo checkout + global `npm:hotmilk` both load** | ~50 duplicate tool/flag diagnostics at startup in-repo | Functional precedence is the project copy (Pi array order). Installed releases yield once they carry `shouldYieldToProjectEntry`; until then silence via `PI_CODING_AGENT_DIR=$(mktemp -d) pi` or wait for the release ([architecture.md](architecture.md)) |
| **Fabricating theme design tokens** | Web frontmatter with no TUI backing | Color source is `themes/monokai.json`; behavior in [DESIGN.md](../DESIGN.md) |

## Docs drift

When code and intent disagree on the same fact, **code wins**; update the quote in docs or note here until fixed ([AGENTS.md](../AGENTS.md)).
