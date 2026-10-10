# Bundles

Every bundled extension row in [`src/config/bundled-extensions.ts`](../src/config/bundled-extensions.ts): how it is classified, whether it runs under omp, and whether you should enable it. Toggle rows with `/mode`, then `/reload`. The registry is the runtime source of truth; this file owns the classification and the recommendations.

The key words MUST, MUST NOT, REQUIRED, SHOULD, SHOULD NOT, RECOMMENDED, NOT RECOMMENDED, MAY, and OPTIONAL are to be interpreted as described in [BCP 14](https://www.rfc-editor.org/info/bcp14) ([RFC 2119](https://www.rfc-editor.org/rfc/rfc2119), [RFC 8174](https://www.rfc-editor.org/rfc/rfc8174)) when, and only when, they appear in all capitals.

## Classification

Four independent axes. Each surface owns its labels; sync facts between them, never merge them.

- **`/mode` group**: UI navigation, from `BUNDLED_EXTENSION_GROUP_ORDER` in the registry.
- **Coupling**: how much hotmilk code touches the row. **Substrate** = direct dependency `gentle-pi`. **Wired** = hotmilk owns a seam in `src/` (list below). **Registry-only** = imported through the loader, no hotmilk code inside. Coupling is the work map for third-party reduction and harness ports.
- **omp**: `yes` when the row carries `omp: true` in the registry, which `bun run audit:omp` verifies against the audited omp release (see [omp support](#omp-support)).
- **Durable**: how the row maps onto [Pi Durable](#pi-durable-fit) if hotmilk moves there. **tools** = its value is tools or skills, which port to durable `defineTool` / prompt sections. **built-in** = durable ships the capability itself (skills section, subagents, forks, compaction), so the row would be dropped. **lifecycle** = it hooks session flow, UI, or other tools' output, which durable owns; porting means a rewrite.

**Level** is the recommendation for a user enabling the row. Every row is off by default (0.2.0 minimal core).

| Id                     | Package                                         | `/mode` group         | Coupling      | omp                                                     | Durable   | Level       | Notes                                                                                                                                                                                                                                                                                                                                       |
| ---------------------- | ----------------------------------------------- | --------------------- | ------------- | ------------------------------------------------------- | --------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `skill-registry`       | `gentle-pi`                                     | Harness               | Substrate     | yes                                                     | built-in  | RECOMMENDED | gentle-pi: indexes user skill dirs (`/skill-registry:refresh`).                                                                                                                                                                                                                                                                             |
| `gentle-ai`            | `gentle-pi`                                     | Harness               | Substrate     | no (no command or tool observed on omp)                 | lifecycle | MAY         | gentle-pi orchestration and review agents, `/gentle:doctor`, `/gentle:status`; required by the `gentleman` persona.                                                                                                                                                                                                                         |
| `context-mode`         | `context-mode`                                  | Context & performance | Wired         | yes                                                     | tools     | RECOMMENDED | `ctx_*` tools for large outputs; loads first in the context stack.                                                                                                                                                                                                                                                                          |
| `ask-user`             | `gentle-pi` (`extensions/ask-user-question.ts`) | Agent tools           | Substrate     | yes                                                     | tools     | RECOMMENDED | Structured `ask_user_question` tool for requirements and risky choices.                                                                                                                                                                                                                                                                     |
| `todo`                 | `gentle-pi` (`extensions/gentle-todo.ts`)       | Agent tools           | Substrate     | no (omp ships its own `todo` tool, so no added surface) | tools     | RECOMMENDED | `todo` tool with an open-task card above the editor and a stale-list nudge.                                                                                                                                                                                                                                                                 |
| `graphify`             | `@runecraft/graphify-pi`                        | Agent tools           | Wired         | yes                                                     | tools     | MAY         | `graphify_*` tools over the graphify CLI (install the CLI separately); hotmilk warns on a stale graph.                                                                                                                                                                                                                                      |
| `subagents`            | `gentle-pi` (`extensions/gentle-agents.ts`)     | Agent tools           | Substrate     | no (omp lacks `generateUnifiedPatch`)                   | built-in  | RECOMMENDED | `subagent_*` delegation tools as isolated `pi --mode rpc` children, plus `/gentle:agents`; gentle-ai's delegation (`subagent_run`) calls them.                                                                                                                                                                                              |
| `lens`                 | `pi-lens`                                       | Agent tools           | Registry-only | yes                                                     | tools     | MAY         | Runtime code feedback: LSP, lint, format, structural analysis, ast-grep.                                                                                                                                                                                                                                                                    |
| `goal`                 | `pi-goal-x`                                     | Integrations          | Registry-only | yes                                                     | lifecycle | MAY         | `/goal`, `/goal-direct`, `/sisyphus`; cross-session goals.                                                                                                                                                                                                                                                                                  |
| `docparser`            | `pi-docparser`                                  | Integrations          | Registry-only | yes                                                     | tools     | MAY         | `document_parse` / `document_search` tools.                                                                                                                                                                                                                                                                                                 |
| `btw`                  | `pi-btw`                                        | Integrations          | Registry-only | no (loads; no new command or tool observed)             | built-in  | MAY         | Side conversation (`/btw`) in a separate session, upstream behavior as is. pi-btw hard-codes an `Alt+W` width toggle that silently shadows a user `alt+w` keybinding; hotmilk drops that one registration while loading `btw` (`DROPPED_SHORTCUTS`, other btw keys untouched). A global `npm:pi-btw` in Pi settings registers it untouched. |
| `rtk-optimizer`        | `pi-rtk-optimizer`                              | Context & performance | Wired         | yes                                                     | lifecycle | MAY         | Bash/read/grep output compaction; install the `rtk` CLI for command rewrite.                                                                                                                                                                                                                                                                |
| `observational-memory` | `pi-observational-memory`                       | Context & performance | Registry-only | yes                                                     | built-in  | MAY         | Compaction continuity (`/om:status`, `recall`).                                                                                                                                                                                                                                                                                             |
| `engram`               | `gentle-engram`                                 | Context & performance | Registry-only | yes                                                     | tools     | MAY         | `mem_*` memory tools (its MCP tools are optional and not bundled).                                                                                                                                                                                                                                                                          |
| `plannotator`          | `@plannotator/pi-extension`                     | Workflow              | Registry-only | yes                                                     | lifecycle | MAY         | Browser plan approval (`/plannotator-*`).                                                                                                                                                                                                                                                                                                   |
| `ponytail`             | `@dietrichgebert/ponytail`                      | Output                | Registry-only | yes                                                     | tools     | MAY         | Lazy-senior output mode (`/ponytail*`); its skills are indexed through `pi.skills` whether or not the row is on.                                                                                                                                                                                                                            |
| `autoresearch`         | `pi-autoresearch`                               | Experiments           | Wired         | no (loads, no command or tool observed)                 | lifecycle | MAY         | Optimize/benchmark loop (`/autoresearch`, `.auto/`).                                                                                                                                                                                                                                                                                        |
| `web-access`           | `pi-web-access`                                 | Agent tools           | Registry-only | yes                                                     | tools     | MAY         | Web search and fetch (`/websearch`, `fetch_content`); needs a search API key.                                                                                                                                                                                                                                                               |
| `fff`                  | `@ff-labs/pi-fff`                               | Agent tools           | Registry-only | yes                                                     | tools     | MAY         | Replaces built-in find/grep (`ffgrep`, `fffind`).                                                                                                                                                                                                                                                                                           |

Removed 2026-10-11 as overlaps (a saved key is ignored, see [problems.md](problems.md)): `caveman` and `simplify` (ponytail covers output mode and simplification), `shazam` (lens), `planning-with-files` (pioneer and plannotator), `vcc` (Pi compaction, observational-memory), `context-view`, `prompt-template-model` (Pi prompt templates and skills), `intercom` (subagent messaging), `kanagawa` (the theme stays as `themes/kanagawa.json`, selectable in Pi settings; only the footer-replacing extension went). `ask-user` and `todo` moved from `@juicesharp/rpiv-*` to gentle-pi's own modules, same tool names.

Wired seams (4):

- `context-mode`: sequential context-stack phase (`loadPhase` in the registry).
- `autoresearch`: shortcut seed into the agent dir ([autoresearch.ts](../src/bootstrap/autoresearch.ts)).
- `rtk-optimizer`: with context-mode on, two forced fields in its `config.json` (`mode: suggest`, `readCompaction` off); otherwise an existing config is untouched and a missing one is seeded with the `rewrite` default. Synced once before load by the pure `alignRtkConfig`, written atomically; the result is reported at session start ([context-stack.ts](../src/bootstrap/context-stack.ts)).
- `graphify`: `graph.json` convention and stale-graph handlers ([graph.ts](../src/bootstrap/graph.ts)).

## Pi Durable fit

[Pi Durable](https://earendil.com/posts/pi-durable/) (`@earendil-works/pi-durable`, experimental) is a separate harness, not a host for pi-coding-agent extensions: its extensions are `defineExtension` bundles of prompt sections, tools (`defineTool` with a `replay` flag), hooks, and tasks, and its experimental coding agent loads no extensions yet. hotmilk rows cannot load there today. Rules that keep the move cheap:

- First-party behavior ships as skills and prompts first: they port as prompt sections unchanged.
- A new row SHOULD be `tools`: its value lives in tools whose effects are safe to rerun or clearly not, which maps onto durable `replay`.
- A `lifecycle` row MUST NOT gain a new hotmilk seam: a seam over session flow, UI, or another tool's output is the part durable replaces.
- A `built-in` row is not ported; durable's own capability takes its place.

## Recommendations

Levels in the table apply to a row on its own. The rules below apply to combinations and setups.

- `context-mode`, `todo`, `ask-user`, `skill-registry`, and `subagents` are RECOMMENDED: no external setup and no conflict with another row. Under omp, `todo` and `subagents` stay off (omp has its own `todo`; gentle-agents needs Pi-only `generateUnifiedPatch`).
- `rtk-optimizer` and `observational-memory` SHOULD be enabled together with `context-mode`.
- `mcp.json` MUST NOT list a `context-mode` server where a host reads it (Pi 1.0 reads `~/.pi/agent/mcp.json` and `.pi/mcp.json`; omp reads its own); `context-mode` registers `ctx_*` itself, and hotmilk does not edit `mcp.json` or bundle MCP rows.
- `autoresearch` and `goal` SHOULD NOT drive the same task.
- `plannotator` is the only bundled plan authority; it SHOULD NOT plan a task that a pioneer W table already plans.
- `pi-subagents-j0k3r` MUST NOT also be installed in Pi settings when `subagents` is on: it registers the same tool names, and gentle-agents then waits with a warning.
- `gentle-ai` SHOULD be paired with `subagents`: its orchestration and review delegation calls `subagent_run`, which hotmilk provides only through `subagents`.
- The `gentleman` persona REQUIRES `gentle-ai`.
- [bigpowers](https://github.com/danielvm-git/bigpowers) (not bundled) MUST NOT run with `pioneer` on the same task.

## omp support

hotmilk detects omp from `CONFIG_DIR_NAME` and loads only rows flagged `omp: true` (14 of 19 today). The support contract, on the omp release pinned as `OMP_AUDITED_VERSION` in the registry:

- hotmilk MUST load without error and MUST register `/mode`, `/stop`, and `/interrupt`.
- Every `omp: true` row MUST load and MUST register at least one command or tool, and the set it registers is printed by `bun run audit:omp`. The audit is manual (not in CI) and runs against the omp on PATH; a clean run on another release prints the new pin to set.
- Rows without the flag MUST NOT load under omp; hotmilk skips them with a session-start warning and `/mode` labels them `(pi only)`.
- Behavior beyond registration (what a tool does when called) is upstream's and is not audited.
- On any other omp release the flags are unverified; hotmilk warns at session start.
- The hotmilk footer does not render under omp (omp stubs `ctx.ui.setFooter`).

Maintainer rules:

- `omp: true` MUST be set only when `bun run audit:omp` reports the row `verified`, and MUST be removed when it does not.
- Bumping `OMP_AUDITED_VERSION` MUST come with a full re-audit.
- A row whose entry is an exported package subpath SHOULD have an entry in [`omp-loaders.js`](../src/bootstrap/omp-loaders.js); omp resolves bundled packages only through literal import specifiers.

[OpenClaw](https://github.com/openclaw/openclaw) is not a hotmilk host: it loads only `openclaw.extensions` and native plugins, never `pi.extensions`.

## Adding a row

Follow [architecture.md](architecture.md#adding-a-bundled-extension) (dependency, registry row, README), then:

- The row MUST NOT set `defaultEnabled` unless ROADMAP moves it into the default-on core.
- The row MUST get a line in the table above with its coupling, omp result, and level.
- The row MUST NOT be added to `package.json` → `pi.extensions` ([AGENTS.md](../AGENTS.md)).
- Run `bun run audit:omp -- <id>` and set `omp: true` only if it reports `verified`.
- An `omp: true` row whose Pi entry is a package subpath SHOULD get a literal-specifier entry in [omp-loaders.js](../src/bootstrap/omp-loaders.js); `test/omp-loaders.test.ts` checks that each entry resolves to the row's module.
