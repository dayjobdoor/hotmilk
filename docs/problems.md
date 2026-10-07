# Problems

Known pitfalls and docs↔runtime drift to watch. Fixes belong in code or the owning doc; record here when the trap is easy to repeat.

## Operator traps

| Problem | Symptom | Mitigation |
| ------- | ------- | ---------- |
| **caveman + `defaults.language: ja`** | English terse rules fight Japanese language hint | Turn off caveman in `/mode`, clear language, or `/caveman off`; session warns ([DESIGN.md](../DESIGN.md)) |
| **kanagawa on** | hotmilk footer replaced | Turn off kanagawa in `/mode` for the status footer back |
| **Toggles without `/reload`** | Extensions still old after `/mode` save | Run `/reload` after changing toggles |
| **Retired row id in `hotmilk.json`** | Saved `extensions.<id>` for a removed registry row (for example `openspec-context`, `sdd-init`, `mcp-adapter`) | None needed: config parsing keeps only ids in `BUNDLED_EXTENSION_IDS`, so the stale key is ignored and dropped on the next save |
| **Alt+W does nothing in the editor** | A `keybindings.json` that maps `tui.editor.cursorWordRight` (or another action) to `alt+w` is shadowed by pi-btw's hard-coded Alt+W width toggle, and Pi lets the extension win silently | hotmilk drops that one registration while loading `btw` (`DROPPED_SHORTCUTS`); other btw keys are untouched. A global `npm:pi-btw` in Pi settings registers it untouched |
| **`[graphify] graph is N commits stale`** | Printed by `@runecraft/graphify-pi` itself (not hotmilk) when HEAD moved past the indexed commit | `graphify_update` (the tool) or `graphify update .`; hotmilk's own warning is the separate `graphify-out/needs_update` flag |
| **Stale graphify index** | `graphify-out/needs_update` present | Run `graphify update .` ([architecture.md](architecture.md)) |

## Install / peers

| Problem | Symptom | Mitigation |
| ------- | ------- | ---------- |
| **Narrow bundled peer ranges** | npm `ERESOLVE` on install | Use repo `.npmrc` `legacy-peer-deps=true`; see README peers section |
| **Nested @earendil-works copies** | Multiple Pi versions under `node_modules` (a consumer install of 0.2.0 hoists `pi-tui` 0.85.1 beside Pi 1.0.0: bundled packages with narrow peers pin it, and `overrides` do not travel) | Inert at runtime: Pi aliases `@earendil-works/pi-tui` to its own copy for every extension (`core/extensions/loader.js`). A direct hotmilk dependency does not change the hoist (checked on a packed 0.2.0 install). `third-party-risk.test.ts` tracks drift; the cure is upstream widening its peers |

## Development traps

| Problem | Symptom | Mitigation |
| ------- | ------- | ---------- |
| **Adding toggled bundle to `pi.extensions`** | Double load or bypass lazy registry | Only `src/index.ts` in `pi.extensions` ([architecture.md](architecture.md)) |
| **Repo checkout + global `npm:hotmilk` both load** | ~50 duplicate tool/flag diagnostics at startup in-repo | Functional precedence is the project copy (Pi array order). Installed releases yield once they carry `shouldYieldToProjectEntry`; until then silence via `PI_CODING_AGENT_DIR=$(mktemp -d) pi` or wait for the release ([architecture.md](architecture.md)) |
| **`: ` in a skill `description`** | Pi's YAML frontmatter parse rejects the skill (it silently does not load) | Keep the first-party `description` in `skills/*/SKILL.md` free of colon-space; verify with `Bun.YAML.parse` on the frontmatter |
| **Fabricating theme design tokens** | Web frontmatter with no TUI backing | Color source is `themes/monokai.json`; behavior in [DESIGN.md](../DESIGN.md) |

## Docs drift

When code and intent disagree on the same fact, **code wins**; update the quote in docs or note here until fixed ([AGENTS.md](../AGENTS.md)).
