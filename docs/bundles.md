# Bundles

Every bundled extension row in [`src/config/bundled-extensions.ts`](../src/config/bundled-extensions.ts): how it is classified, whether it runs under omp, and whether you should enable it. Toggle rows with `/mode`, then `/reload`. The registry is the runtime source of truth; this file owns the classification and the recommendations.

The key words MUST, MUST NOT, REQUIRED, SHOULD, SHOULD NOT, RECOMMENDED, NOT RECOMMENDED, MAY, and OPTIONAL are to be interpreted as described in [BCP 14](https://www.rfc-editor.org/info/bcp14) ([RFC 2119](https://www.rfc-editor.org/rfc/rfc2119), [RFC 8174](https://www.rfc-editor.org/rfc/rfc8174)) when, and only when, they appear in all capitals.

## Classification

Three independent axes. Each surface owns its labels; sync facts between them, never merge them.

- **`/mode` group**: UI navigation, from `BUNDLED_EXTENSION_GROUP_ORDER` in the registry.
- **Coupling**: how much hotmilk code touches the row. **Substrate** = direct dependency `gentle-pi`. **Wired** = hotmilk owns a seam in `src/` (list below). **Registry-only** = imported through the loader, no hotmilk code inside. Coupling is the work map for third-party reduction and harness ports.
- **omp**: `yes` when the row carries `omp: true` in the registry, which `bun run audit:omp` verifies against the audited omp release (see [omp support](#omp-support)).

**Level** is the recommendation for a user enabling the row. Every row is off by default (0.2.0 minimal core).

| Id | Package | `/mode` group | Coupling | omp | Level | Notes |
| -- | ------- | ------------- | -------- | --- | ----- | ----- |
| `skill-registry` | `gentle-pi` | Harness | Substrate | yes | RECOMMENDED | gentle-pi: indexes user skill dirs (`/skill-registry:refresh`). |
| `gentle-ai` | `gentle-pi` | Harness | Substrate | no (fails: omp's `pi-tui` lacks `MouseRegion`) | MAY | gentle-pi orchestration and review agents, `/gentle:doctor`, `/gentle:status`; required by the `gentleman` persona. |
| `context-mode` | `context-mode` | Context & performance | Wired | yes | RECOMMENDED | `ctx_*` tools for large outputs; loads first in the context stack. |
| `context-view` | `pi-context-view` | Context & performance | Registry-only | no (loads, no command or tool observed) | MAY | `/context` usage and hidden-injection viewer. |
| `vcc` | `@sting8k/pi-vcc` | Context & performance | Registry-only | yes | MAY | Algorithmic compaction (`/pi-vcc`); replaces default compaction while on. |
| `ask-user` | `@juicesharp/rpiv-ask-user-question` | Agent tools | Registry-only | yes | RECOMMENDED | Structured `ask_user_question` tool for requirements and risky choices. |
| `todo` | `@juicesharp/rpiv-todo` | Agent tools | Registry-only | yes | RECOMMENDED | Explicit task-state tracking (`/todos`). |
| `graphify` | `@runecraft/graphify-pi` | Agent tools | Wired | yes | MAY | `graphify_*` tools over the graphify CLI (install the CLI separately); hotmilk warns on a stale graph. |
| `shazam` | `pi-shazam` | Agent tools | Registry-only | yes | MAY | Tree-sitter + LSP execute guards (`shazam_impact`, `shazam_verify`); complements graphify. |
| `prompt-template-model` | `pi-prompt-template-model` | Agent tools | Registry-only | yes | MAY | Prompt template model selector (`/chain-prompts`, `/prompt-tool`). |
| `subagents` | `gentle-pi` (`extensions/gentle-agents.ts`) | Agent tools | Registry-only | no (omp lacks `generateUnifiedPatch`) | RECOMMENDED | `subagent_*` delegation tools as isolated `pi --mode rpc` children, plus `/gentle:agents`; gentle-ai's delegation (`subagent_run`) calls them. Replaces the retired `pi-subagents-j0k3r`. |
| `lens` | `pi-lens` | Agent tools | Registry-only | yes | MAY | Runtime code feedback: LSP, lint, format, structural analysis. |
| `goal` | `pi-goal-x` | Integrations | Registry-only | yes | MAY | `/goal`, `/goal-direct`, `/sisyphus`; cross-session goals. |
| `docparser` | `pi-docparser` | Integrations | Registry-only | yes | MAY | `document_parse` / `document_search` tools. |
| `btw` | `pi-btw` | Integrations | Registry-only | no (loads; no new command or tool observed on omp 18.4.10) | MAY | Side conversation (`/btw`) in a separate session, upstream behavior as is; hotmilk only drops its `Alt+W` shortcut. |
| `intercom` | `pi-intercom` | Integrations | Registry-only | yes | MAY | Cross-session messaging (`/intercom`). |
| `simplify` | `pi-simplify` | Context & performance | Registry-only | yes | MAY | `/simplify` code simplification pass. |
| `rtk-optimizer` | `pi-rtk-optimizer` | Context & performance | Wired | yes | MAY | Bash/read/grep output compaction; install the `rtk` CLI for command rewrite. |
| `observational-memory` | `pi-observational-memory` | Context & performance | Registry-only | yes | MAY | Compaction continuity (`/om:status`, `recall`). |
| `engram` | `gentle-engram` | Context & performance | Registry-only | yes | MAY | `mem_*` memory tools (its MCP tools are optional and not bundled). |
| `planning-with-files` | `@tomxprime/planning-with-files` | Workflow | Registry-only | yes | MAY | On-disk plan commands (`/plan-status`, `/plan-attest`, `/plan-goal`, `/plan-loop`); hotmilk does not index its skill. |
| `plannotator` | `@plannotator/pi-extension` | Workflow | Registry-only | yes | MAY | Browser plan approval (`/plannotator-*`). |
| `caveman` | `pi-caveman` | Output | Registry-only | yes | MAY | Terse output mode (`/caveman`). |
| `ponytail` | `@dietrichgebert/ponytail` | Output | Registry-only | yes | MAY | Lazy-senior output mode (`/ponytail*`). |
| `autoresearch` | `pi-autoresearch` | Experiments | Wired | no (loads, no command or tool observed) | MAY | Optimize/benchmark loop (`/autoresearch`, `.auto/`). |
| `web-access` | `pi-web-access` | Agent tools | Registry-only | yes | MAY | Web search and fetch (`/websearch`, `fetch_content`); needs a search API key. |
| `fff` | `@ff-labs/pi-fff` | Agent tools | Registry-only | yes | MAY | Replaces built-in find/grep (`ffgrep`, `fffind`). |
| `kanagawa` | `pi-kanagawa` | Output | Wired | no (loads, no command or tool observed; omp stubs `setFooter`) | MAY | Vendored theme; replaces the hotmilk footer while on. |

Wired seams (5):

- `context-mode`: sequential context-stack phase (`loadPhase` in the registry).
- `autoresearch`: shortcut seed into the agent dir ([autoresearch.ts](../src/bootstrap/autoresearch.ts)).
- `rtk-optimizer`: with context-mode on, two forced fields in its `config.json` (`mode: suggest`, `readCompaction` off); otherwise an existing config is untouched and a missing one is seeded with the `rewrite` default. Synced once before load by the pure `alignRtkConfig`, written atomically; the result is reported at session start ([context-stack.ts](../src/bootstrap/context-stack.ts)).
- `graphify`: `graph.json` convention and stale-graph handlers ([graph.ts](../src/bootstrap/graph.ts)).
- `kanagawa`: hotmilk-owned wrapper that skips the duplicate `/thinking` ([kanagawa.ts](../src/bundled/kanagawa.ts)).

## Recommendations

Levels in the table apply to a row on its own. The rules below apply to combinations and setups.

- `context-mode`, `todo`, `ask-user`, `skill-registry`, and `subagents` are RECOMMENDED: no external setup and no conflict with another row; all but `subagents` are verified under omp (gentle-agents needs Pi-only `generateUnifiedPatch`).
- `rtk-optimizer` and `observational-memory` SHOULD be enabled together with `context-mode`.
- `mcp.json` MUST NOT list a `context-mode` server where a host reads it (Pi 1.0 reads `~/.pi/agent/mcp.json` and `.pi/mcp.json`; omp reads its own); `context-mode` registers `ctx_*` itself, and hotmilk does not edit `mcp.json` or bundle MCP rows.
- `caveman` SHOULD NOT be on while `defaults.language` is `ja`; hotmilk warns at session start.
- `autoresearch` and `goal` SHOULD NOT drive the same task.
- `planning-with-files` and `plannotator` SHOULD NOT both plan one task: one plan authority per change ([pioneer](../skills/pioneer/SKILL.md)).
- `pi-subagents-j0k3r` MUST NOT also be installed in Pi settings when `subagents` is on: it registers the same tool names, and gentle-agents then waits with a warning.
- `gentle-ai` SHOULD be paired with `subagents`: its orchestration and review delegation calls `subagent_run`, which hotmilk provides only through `subagents`.
- The `gentleman` persona REQUIRES `gentle-ai`.
- `kanagawa` MAY be enabled for its theme; while on it replaces the hotmilk footer (the startup intro still plays).
- [bigpowers](https://github.com/danielvm-git/bigpowers) (not bundled) MUST NOT run with `pioneer` on the same task.

## omp support

hotmilk detects omp from `CONFIG_DIR_NAME` and loads only rows flagged `omp: true` (22 of 28 today). The support contract, on the omp release pinned as `OMP_AUDITED_VERSION` in the registry:

- hotmilk MUST load without error and MUST register `/mode`, `/stop`, and `/interrupt`.
- Every `omp: true` row MUST load and MUST register at least one command or tool, and the set it registers is printed by `bun run audit:omp`. CI (`omp-audit` job) installs the pinned release, verifies its checksum, runs the audit, and blocks publish on any mismatch.
- Rows without the flag MUST NOT load under omp; hotmilk skips them with a session-start warning and `/mode` labels them `(pi only)`.
- Behavior beyond registration (what a tool does when called) is upstream's and is not audited.
- On any other omp release the flags are unverified; hotmilk warns at session start.
- The hotmilk footer does not render under omp (omp stubs `ctx.ui.setFooter`).

Maintainer rules:

- `omp: true` MUST be set only when `bun run audit:omp` reports the row `verified`, and MUST be removed when it does not.
- Bumping `OMP_AUDITED_VERSION` MUST come with a full re-audit and the new release's `omp-linux-x64` sha256 in `OMP_AUDITED_SHA256`; CI compares the downloaded binary to that committed value.
- A row whose entry is an exported package subpath SHOULD have an entry in [`omp-loaders.js`](../src/bootstrap/omp-loaders.js); omp resolves bundled packages only through literal import specifiers.

[OpenClaw](https://github.com/openclaw/openclaw) is not a hotmilk host: it loads only `openclaw.extensions` and native plugins, never `pi.extensions`.

## Adding a row

Follow [architecture.md](architecture.md#adding-a-bundled-extension) (dependency, registry row, README), then:

- The row MUST NOT set `defaultEnabled` unless ROADMAP moves it into the default-on core.
- The row MUST get a line in the table above with its coupling, omp result, and level.
- The row MUST NOT be added to `package.json` → `pi.extensions` ([AGENTS.md](../AGENTS.md)).
- Run `bun run audit:omp -- <id>` and set `omp: true` only if it reports `verified`.
- An `omp: true` row whose Pi entry is a package subpath SHOULD get a literal-specifier entry in [omp-loaders.js](../src/bootstrap/omp-loaders.js); `test/omp-loaders.test.ts` checks that each entry resolves to the row's module.
