# hotmilk

**hotmilk** is a Pi meta-package: one install wires gentle-pi, context-mode, graphify, subagents, and related extensions, plus user toggles in `$PI_CODING_AGENT_DIR/hotmilk.json` (Pi agent dir; see [Configuration](#configuration)).

Use it when you want a practical engineering workstation without hand-picking a dozen `pi-*` packages and wiring `settings.json` yourself.

## Contents

- [What you get](#what-you-get)
- [Quick start](#quick-start)
- [Configuration](#configuration): toggles, `/mode` groups, [workflow routing](#workflow-routing)
- [Development](#development)
- [Documentation map](docs/guidance.md)

## What you get

| Layer                       | Packages / assets                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Orchestration**           | [gentle-pi](https://www.npmjs.com/package/gentle-pi) (el Gentleman, SDD/OpenSpec, skill registry, `/gentle:doctor`), [pi-openspec-context](https://www.npmjs.com/package/pi-openspec-context) (default off) |
| **Context**                 | [context-mode](https://www.npmjs.com/package/context-mode), [pi-context-view](https://www.npmjs.com/package/pi-context-view) (default off), [@sting8k/pi-vcc](https://www.npmjs.com/package/@sting8k/pi-vcc) (default off), [pi-simplify](https://www.npmjs.com/package/pi-simplify), [pi-rtk-optimizer](https://www.npmjs.com/package/pi-rtk-optimizer) (default off), [pi-observational-memory](https://www.npmjs.com/package/pi-observational-memory) (default off)                                                              |
| **Codebase graph**          | [@runecraft/graphify-pi](https://www.npmjs.com/package/@runecraft/graphify-pi) (default on: `graphify_build/query/path/explain/update` tools over the [graphify](https://github.com/Graphify-Labs/graphify) CLI); optional [pi-shazam](https://www.npmjs.com/package/pi-shazam) (default off)                                                                                                                                                                                                                                                                                                                                                                                  |
| **Subagents & interaction** | [pi-subagents-j0k3r](https://www.npmjs.com/package/pi-subagents-j0k3r), [@juicesharp/rpiv-ask-user-question](https://www.npmjs.com/package/@juicesharp/rpiv-ask-user-question), [@juicesharp/rpiv-todo](https://www.npmjs.com/package/@juicesharp/rpiv-todo), [pi-intercom](https://www.npmjs.com/package/pi-intercom), [pi-lens](https://www.npmjs.com/package/pi-lens), [gentle-engram](https://www.npmjs.com/package/gentle-engram), [pi-herdr-squad](https://www.npmjs.com/package/pi-herdr-squad) (Herdr panes off by default) |
| **Goals & docs**            | [pi-goal-x](https://www.npmjs.com/package/pi-goal-x) (default off; `/goal`, `/goal-direct`, `/sisyphus`), [pi-docparser](https://www.npmjs.com/package/pi-docparser)                                                                                                                                                                                                                                                                                                                                          |
| **File-based planning**     | [@tomxprime/planning-with-files](https://www.npmjs.com/package/@tomxprime/planning-with-files) (default off), [@plannotator/pi-extension](https://www.npmjs.com/package/@plannotator/pi-extension) (browser plan approval)                                                                                                                                                                                                                                                                                                          |
| **Integrations**            | [pi-codemcp](https://www.npmjs.com/package/pi-codemcp) (sandboxed Code Mode, default on), [pi-mcp-adapter](https://www.npmjs.com/package/pi-mcp-adapter) (default off), [pi-btw](https://www.npmjs.com/package/pi-btw) (side channel; see below)                                                                                                                                                                                                                                             |
| **Web tools**               | [pi-web-access](https://www.npmjs.com/package/pi-web-access)                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| **Search tools**            | [@ff-labs/pi-fff](https://www.npmjs.com/package/@ff-labs/pi-fff) (replaces built-in find/grep, default off)                                                                                                                                                                                                                                                                                                                                                                                                                         |
| **Experiment loops**        | [pi-autoresearch](https://www.npmjs.com/package/pi-autoresearch) (default off)                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **Output style**            | [pi-caveman](https://www.npmjs.com/package/pi-caveman), [@dietrichgebert/ponytail](https://www.npmjs.com/package/@dietrichgebert/ponytail) (lazy-senior mode); bundled kanagawa theme (default off)                                                                                                                                                                                                                                                                                               |
| **Local assets**            | `./prompts`, `./skills`, `./themes`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

Bundled extension **on/off** is controlled in `hotmilk.json` (via `/mode`), then `/reload`. Only `src/index.ts` is listed in `package.json` → `pi.extensions`; every other bundled package is loaded dynamically when its toggle is `true`. Package-level `pi.skills` / `pi.prompts` / `pi.themes` paths are always indexed by Pi (they are not gated by `/mode` toggles).

## Quick start

### Install

```bash
pi install npm:hotmilk
```

Or add to Pi settings (`$PI_CODING_AGENT_DIR/settings.json` or project `.pi/settings.json`):

```json
{
  "packages": ["npm:hotmilk"]
}
```

Local checkout:

```bash
pi install -l npm:hotmilk
```

### First run

1. Open a project directory in Pi.
2. On first session, hotmilk creates `$PI_CODING_AGENT_DIR/hotmilk.json` if missing (extension defaults come from the registry).
3. After config changes, run `/reload`.

### Pi and npm peers

Peer ranges live in **`package.json` → `peerDependencies`**. Some bundled dependencies still declare **narrow peer ranges** that disagree with hotmilk’s Pi peers (`pi-lens` / `pi-mcp-adapter` windows stop below the current Pi line, and `pi-goal-x` excludes older 0.8x, tracked in [third-party-risk.test.ts](test/third-party-risk.test.ts)). npm may report `ERESOLVE` until those packages publish wider peers.

This repo ships **`.npmrc`** with `legacy-peer-deps=true` so `npm install` and `npm ci` succeed. Treat upstream extensions as **best-effort** until their maintainers widen peer ranges.

### Project trust

Pi gates project-local `.pi/` resources and `.agents/skills` behind **project trust** ([Pi docs](https://pi.dev/docs/latest/security#project-trust)). hotmilk registers a `project_trust` handler and, by default, defers to Pi's built-in prompt (`projectTrust.mode: "delegate"`).

Configure in `$PI_CODING_AGENT_DIR/hotmilk.json`:

```json
{
  "projectTrust": {
    "mode": "delegate",
    "remember": false
  }
}
```

| `mode`     | Behavior                                                                       |
| ---------- | ------------------------------------------------------------------------------ |
| `delegate` | Let Pi resolve trust (`trust.json`, `defaultProjectTrust`, or built-in prompt) |
| `prompt`   | hotmilk confirm explaining what project trust enables                          |
| `always`   | Trust project-local resources (optionally `remember: true`)                    |
| `never`    | Decline project-local resources for this handler                               |

On startup, hotmilk scans only **global** Pi settings for bundled-extension dedupe. After trust, project `.pi/settings.json` duplicates are reported; run `/reload` to dedupe.

When a hotmilk repo checkout (project package) and a globally installed `npm:hotmilk` would both load, the npm-installed copy yields and the project copy owns registration (project → user precedence). An installed release yields only once it carries this guard; until then, in-repo sessions report duplicate-tool diagnostics. To develop in-repo without them today, launch with a clean agent dir (`PI_CODING_AGENT_DIR=$(mktemp -d) pi`) so only the project copy loads (config seeds on first run).

### Commands (hotmilk)

| Command                | Purpose                                                                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `/mode`                | Toggle persona (`gentleman` / `neutral` / `gyal` / `raiden`) and bundled extensions; writes `$PI_CODING_AGENT_DIR/hotmilk.json` |
| `/stop`                | Stop current running work                                                                                                       |
| `/interrupt <message>` | Steer in-flight work with an interrupt prompt                                                                                   |
| `/subagents-doctor`    | When `subagents` is on: doctor report (hotmilk registers this in `src/bootstrap/subagents-doctor.ts`)                           |

Upstream packages add their own commands (gentle-pi `/gentle:status`, `/gentle:doctor`, SDD chains, graphify, context-mode, planning-with-files `/plan-status`, plannotator `/plannotator`, and so on).

For **which plan, memory, or optimize path to use**, see [Workflow routing](#workflow-routing) and the bundled [`pioneer`](skills/pioneer/SKILL.md) skill.

## Configuration

**Pi agent directory:** `$PI_CODING_AGENT_DIR` when set, otherwise `~/.pi/agent`. Pi and hotmilk resolve the same path (`getAgentDir()`). Paths below use `$PI_CODING_AGENT_DIR/…`.

### `$PI_CODING_AGENT_DIR/hotmilk.json`

Bundled extension defaults live in [`src/config/bundled-extensions.ts`](src/config/bundled-extensions.ts). `hotmilk.json` stores user overrides and non-extension defaults; edit it with `/mode`, then run `/reload` to apply extension changes.

| Key / area                        | Behavior                                                                                                                                                                                               |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `extensions.*`                    | Set to `false` to skip registering that bundled extension                                                                                                                                              |
| `extensions.gentle-ai`            | Default `true`. gentle-pi: orchestration, lazy SDD preflight, OpenSpec SDD agents, `/gentle:doctor` / `/gentle:status`. hotmilk does not load gentle-pi `startup-banner`.                                 |
| `extensions.sdd-init`             | Default `true`. gentle-pi SDD/OpenSpec init.                                                                                                                                                           |
| `extensions.subagents`            | Default `true`. pi-subagents-j0k3r: `subagent_*` delegation, task/background modes, history, model profiles. Use with `gentle-ai` for focused delegation.                                              |
| `extensions.ask-user`             | Default `true`. `@juicesharp/rpiv-ask-user-question` provides structured questions when requirements or risky choices need explicit user input.                                                        |
| `extensions.todo`                 | Default `true`. `@juicesharp/rpiv-todo` provides explicit task-state tracking for the parent workflow.                                                                                                 |
| `extensions.lens`                 | Default `true`. `pi-lens` provides runtime code feedback, LSP, lint, format, and structural analysis.                                                                                                  |
| `extensions.btw`                  | Default `true`. Side conversation via `/btw` while main runs. **Delegate implementation to subagents**; use BTW for quick human questions. See [pi-btw coexistence](#pi-btw-with-subagents-default-on) |
| `extensions.context-mode`         | Default `true`. Prefer `ctx_*` for large outputs (see project context-window rules)                                                                                                                    |
| `extensions.context-view`         | Default `false`. `pi-context-view`: `/context`, `/context usage`, `/context injections`; inspect context usage and hidden context injections                                                           |
| `extensions.vcc`                  | Default `false`. `@sting8k/pi-vcc`: algorithmic compaction via `/pi-vcc`; changes Pi compaction behavior only when enabled                                                                             |
| `extensions.observational-memory` | Default `false`. Compaction continuity; pairs with `context-mode`. See [Workflow routing](#workflow-routing)                                                                                           |
| `extensions.shazam`               | Default `false`. Tree-sitter + LSP execute guards (`shazam_impact`, `shazam_verify`); complements graphify: see [Workflow routing](#workflow-routing)                                                 |
| `extensions.herdr-squad`          | Default `false`. Visible read-only Herdr investigation squads (`/herdr-squad`). Requires Pi inside a Herdr-managed pane (`HERDR_ENV=1`)                                                                |
| `extensions.rtk-optimizer`        | Default `false`. Bash/read/grep output compaction; enable with `context-mode` for leftover shell output. Install [`rtk` CLI](https://github.com/rtk-ai/rtk) for command rewrite (`/rtk verify`)        |
| `extensions.planning-with-files`  | Default `false`. On-disk planning: see [Workflow routing](#workflow-routing)                                                                                                                          |
| `extensions.plannotator`          | Default `false`. Browser plan approval: see [Workflow routing](#workflow-routing)                                                                                                                     |
| `extensions.autoresearch`         | Default `false`. Optimize loop: see [Workflow routing](#workflow-routing)                                                                                                                             |
| `extensions.goal`                 | Default `false`. [pi-goal-x](https://www.npmjs.com/package/pi-goal-x): `/goal` (define + auto-continue), `/goal-direct` (start immediately), `/sisyphus` (ordered steps), cross-session persistence, optional completion auditor. Stacks with subagents; avoid running `autoresearch` on the same task |
| `extensions.graphify`             | Default `true`. [@runecraft/graphify-pi](https://www.npmjs.com/package/@runecraft/graphify-pi): `graphify_build/query/path/explain/update` tools over the [graphify](https://github.com/Graphify-Labs/graphify) CLI. Stale-graph warning stays in hotmilk ([graph handlers](src/bootstrap/graph.ts)) |
| `extensions.openspec-context`     | Default `false`. [pi-openspec-context](https://www.npmjs.com/package/pi-openspec-context): injects OpenSpec spec context into the system prompt each session (cached per workspace). Complements `sdd-init` (one-shot `config.yaml` bootstrap); off by default to keep per-turn prompt cost opt-in |
| `extensions.engram`               | Default `true`. [gentle-engram](https://www.npmjs.com/package/gentle-engram) memory layer (Context & performance group). `pi-engram init` declares `npm:pi-mcp-adapter` in Pi settings (peer `>=2.5.0`), which Pi loads regardless of the hotmilk toggle — the adapter default off only affects sessions where no settings entry provides it |
| Enabled extensions                | `context-mode` / `rtk-optimizer` load first (context stack), then all other enabled extensions **in parallel**. BTW uses a pre-load session hook but loads through the same registry path.             |
| `graph.warnOnStale`               | Notify when `graphify-out/needs_update` exists                                                                                                                                                         |
| `graph.autoSuggestUpdate`         | Append `graphify update .` to that notification                                                                                                                                                        |
| `defaults.persona`                | `/mode` picker; `hotmilk.json` stays authoritative; the gentle-pi marker (`.pi/gentle-ai/persona.json`) is reconciled at session start. Supported: `gentleman`, `neutral`, `gyal`, `raiden`; default `neutral`. `gyal`/`raiden` replace gentle-pi's persona section. |
| `defaults.language`               | Appends a project language hint to the system prompt each turn                                                                                                                                         |
| `projectTrust.mode`               | Pi project trust: `delegate` (default), `prompt`, `always`, or `never`                                                                                                                                 |
| `projectTrust.remember`           | When `mode` is `always` or `never`, persist the decision in Pi `trust.json`                                                                                                                            |
| `extensions.mcp-adapter`          | Default `false`. One Pi tool per MCP server tool from `$PI_CODING_AGENT_DIR/mcp.json`. Off by default because `codemcp` covers the same servers through its sandbox; enable it if you want direct per-tool calls without the Python runtime |
| `extensions.codemcp`              | Default `true`. [pi-codemcp](https://www.npmjs.com/package/pi-codemcp): typed, sandboxed Code Mode over MCP servers (`/codemcp`). Writes a Python program and runs batched calls; intermediate data stays in the sandbox. Reads and writes the same `$PI_CODING_AGENT_DIR/mcp.json` as `mcp-adapter` (same rule: no context-mode server), so `/codemcp` server toggles change what the adapter exposes. Bootstraps a locked Python 3.13 runtime on first use (needs network). Registers only `codemcp_*` tools (server tools run inside the sandbox); with `mcp-adapter` on, the same servers are reachable by two paths. Set `"codemcp": false` and `mcp-adapter: true` for the adapter-only setup |

**MCP (default):** `context-mode` extension registers `ctx_*` via its built-in bridge (same module as [upstream `.pi/extensions/context-mode`](https://github.com/mksglu/context-mode/tree/main/.pi/extensions/context-mode), loaded from `build/adapters/pi/extension.js`). Hotmilk removes any `context-mode` server from `$PI_CODING_AGENT_DIR/mcp.json` when the extension is on. `codemcp` (default on) and `mcp-adapter` (default off) both read that file; enable `mcp-adapter` only for **other** MCP servers—not a second context-mode entry.

### `/mode` groups

`/mode` renders groups from `BUNDLED_EXTENSION_GROUP_ORDER` in [`src/config/bundled-extensions.ts`](src/config/bundled-extensions.ts).

### Workflow routing

Canonical workflow routing is in the bundled [`pioneer`](skills/pioneer/SKILL.md) skill. Pick one plan authority per task; memory and optimize loops layer beside execution.

### Agents, skills, and scope

Pi resolves bundled assets at **user (global)**, **project**, and **package** layers. hotmilk ships package defaults; you override per machine or per repo.

| Layer             | Config                                                                    | Agents (pi-subagents-j0k3r)                                                                   | Skills / prompts                                                                                              |
| ----------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **User (global)** | `$PI_CODING_AGENT_DIR/hotmilk.json`, `$PI_CODING_AGENT_DIR/settings.json` | `$PI_CODING_AGENT_DIR/agents/` or `~/.agents/`                                                | User skill dirs indexed by gentle-pi `skill-registry`                                                         |
| **Project**       | `.pi/settings.json`                                                       | **`.pi/agents/`** (canonical); legacy `.agents/` still read                                   | `.pi/skills/`; legacy `.agents/skills/`                                                                       |
| **Package**       | `pi install npm:hotmilk`                                                  | **`agents/` in the npm tarball** (source of truth in git, **not** auto-discovered at runtime) | `package.json` → `pi.skills`, `pi.prompts`, `pi.themes` (always indexed; extension toggles do not gate these) |

**Precedence (same runtime name):** project → user → builtin (pi-subagents-j0k3r built-ins). `/run`, chains, and the `subagent` tool default to `agentScope: "both"` (user + project + builtin).

**hotmilk subagents**

- **Edit in git / npm:** `agents/*.md`: package canonical prompts (`package: hotmilk` in frontmatter → runtime name `hotmilk.coach`, `hotmilk.planner`, …).
- **Pi discovery:** copy or symlink into **`.pi/agents/`** for the project you are working in. pi-subagents-j0k3r reads project and user dirs only; it does not scan the installed package’s `agents/` folder.
- **Parent vs child:** the main session runs gentle-ai orchestration (delegation, SDD, skill injection). Subagents get isolated prompts; the parent stays responsible for `/run`, acceptance blocks, and routing.

After changing prompts in this repo, sync the local project overlay (often untracked):

```bash
cp agents/*.md .pi/agents/
```

Verify with `/subagents-doctor`; expect `hotmilk.*` under project agents when `.pi/agents/` is populated.

### Environment variables

Pi and bundled extensions read the process environment. hotmilk honors **`PI_CODING_AGENT_DIR`** for `hotmilk.json` and global extension dedupe (same agent dir as Pi). **`HOTMILK_CONFIG_ROOT`** overrides that for tests/sandboxes.

**Pi core** (full list in [Pi usage: environment variables](https://pi.dev/docs/latest/usage#environment-variables)):

| Variable                      | Purpose                                                                                                                       |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `PI_CODING_AGENT_DIR`         | Override agent config dir (default `~/.pi/agent`). hotmilk uses this for `hotmilk.json`, global settings dedupe, and MCP path |
| `PI_CODING_AGENT_SESSION_DIR` | Override session storage (also `--session-dir`)                                                                               |
| `PI_PACKAGE_DIR`              | Override package dir (Nix/Guix store paths)                                                                                   |
| `PI_OFFLINE`                  | Disable startup network (update checks, package checks, install telemetry)                                                    |
| `PI_SKIP_VERSION_CHECK`       | Skip `pi.dev` latest-version check only                                                                                       |
| `PI_TELEMETRY`                | Opt in/out of install/update telemetry and provider attribution headers (`1`/`0`)                                             |
| `PI_CACHE_RETENTION`          | `long` for extended prompt cache where supported                                                                              |
| `PI_TIMING`                   | `1`: emit timing diagnostics                                                                                                 |
| `PI_HARDWARE_CURSOR`          | `1`: show hardware cursor (IME / some terminals)                                                                             |
| `PI_TUI_WRITE_LOG`            | Path; log raw TUI ANSI to a file (debug)                                                                                     |
| `VISUAL`, `EDITOR`            | External editor for Ctrl+G                                                                                                    |

**LLM providers** (Pi `auth.json` → env fallback; not hotmilk-specific): common keys include `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `GOOGLE_API_KEY`, `OPENROUTER_API_KEY`, Azure (`AZURE_OPENAI_*`), Vertex (`GOOGLE_CLOUD_*`). See [@earendil-works/pi-ai](https://www.npmjs.com/package/@earendil-works/pi-ai) for the full provider table.

**hotmilk-owned**:

| Variable              | Purpose                                                                                                                            |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `HOTMILK_CONFIG_ROOT` | Test/sandbox override for the directory that contains `hotmilk.json`. Wins over `PI_CODING_AGENT_DIR`. Normal installs leave unset |

**Bundled extensions** (only when the matching `/mode` toggle is on):

| Variable                                              | Toggle / package | Purpose                                               |
| ----------------------------------------------------- | ---------------- | ----------------------------------------------------- |
| `PI_SUBAGENTS_HISTORY_DB_PATH`                        | `subagents`      | Override j0k3r task-history SQLite path               |
| `PI_SUBAGENTS_HISTORY_HOME`                           | `subagents`      | Override j0k3r task-history home directory            |
| `GEMINI_API_KEY`, `GOOGLE_API_KEY`                    | `graphify` (CLI) | Semantic extraction backend for `graphify extract`    |
| `GRAPHIFY_GEMINI_MODEL`, `GRAPHIFY_WHISPER_MODEL`     | `graphify` (CLI) | Override graphify LLM / Whisper model                 |
| `EXA_API_KEY`, `PERPLEXITY_API_KEY`, `GEMINI_API_KEY` | `web-access`     | Search / fetch keys (`~/.pi/web-search.json` also)    |
| `PI_ALLOW_BROWSER_COOKIES`                            | `web-access`     | `1`: allow Chromium cookie extraction for Gemini Web |
| `CTX_FETCH_STRICT`                                    | `context-mode`   | `1`: stricter fetch routing in context-mode          |

**CI / publish** (this repo only): GitHub Actions uses secret **`NPM_TOKEN`**; `setup-node` maps it to **`NODE_AUTH_TOKEN`** for `npm publish`. Local `bun publish` uses `~/.npmrc`, not `NPM_TOKEN`.

### pi-btw with subagents (default on)

Both **`subagents`** and **`btw`** default to **on**. They do not share commands or extension IDs; hotmilk loads them in parallel.

| Do this                                         | Tool                                                                                         |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Exploration, implementation, review, SDD phases | **subagents** (`Task`, `/run`, `/chain`; use `worktree: true` when running parallel writers) |
| Ask a quick question while main is working      | **`/btw`** or **`/btw:tangent`** (`Alt+/` toggles BTW ↔ main)                                |
| Bring BTW results back to the main thread       | **`/btw:inject`**                                                                            |

BTW runs a **separate** Pi session. hotmilk wraps upstream pi-btw (`src/bootstrap/btw.ts`):

- **`subagents: true` (default):** read-biased tools only (`read`, `grep`, `find`, `ls`, `bash`); no main-cwd `edit`/`write`.
- **`graphify: true` + `graphify-out/graph.json`:** adds **`graphify_query`** (CLI-backed) for architecture questions.
- **`context-mode: true`:** adds **`ctx_search`** proxy to the main session knowledge base (read-only).
- Inherited prompts drop main-session harness noise (gentle-ai orchestrator, graphify rules, caveman); project AGENTS.md stays.
- Still **no** `ctx_execute`, Task, or MCP inside BTW; use main/subagents for heavy ctx work.

Global `npm:pi-btw` in Pi settings skips the hotmilk shim (standard dedupe). Prefer bundled hotmilk so BTW gets prompt/tool patches via `createAgentSession` hook.

During subagent chains, avoid BTW file edits on the main cwd; use read-only or `:tangent` until workers finish.

Set `"btw": false` in `/mode` if you want delegation only with no side channel.

### Optional extensions (off by default)

Enable in `/mode` or set the key to `true` in `hotmilk.json`, then `/reload`. Workflow-oriented toggles are summarized in [Workflow routing](#workflow-routing).

| Toggle                  | Package                                                                                        | Notes                                                                  |
| ----------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `mcp-adapter`           | [pi-mcp-adapter](https://www.npmjs.com/package/pi-mcp-adapter)                                 | One Pi tool per MCP server tool; enable if you skip `codemcp`          |
| `openspec-context`      | [pi-openspec-context](https://www.npmjs.com/package/pi-openspec-context)                       | OpenSpec spec context per session; complements `sdd-init`              |
| `planning-with-files`   | [@tomxprime/planning-with-files](https://www.npmjs.com/package/@tomxprime/planning-with-files) | On-disk planning; `/skill:planning-with-files`                         |
| `observational-memory`  | [pi-observational-memory](https://www.npmjs.com/package/pi-observational-memory)               | Compaction continuity; V3 = clean session after upgrade                |
| `shazam`                | [pi-shazam](https://www.npmjs.com/package/pi-shazam)                                           | `shazam_*` tools; LSP-backed verify; complements graphify              |
| `autoresearch`          | [pi-autoresearch](https://www.npmjs.com/package/pi-autoresearch)                               | `/autoresearch`, `.auto/`; shortcut override in `pi-autoresearch.json` |
| `fff`                   | [@ff-labs/pi-fff](https://www.npmjs.com/package/@ff-labs/pi-fff)                               | Replaces built-in find/grep                                            |
| `context-view`          | [pi-context-view](https://www.npmjs.com/package/pi-context-view)                               | `/context` usage and hidden-injection viewer                           |
| `vcc`                   | [@sting8k/pi-vcc](https://www.npmjs.com/package/@sting8k/pi-vcc)                               | Algorithmic compaction; opt-in because it replaces default compaction  |
| `prompt-template-model` | [pi-prompt-template-model](https://www.npmjs.com/package/pi-prompt-template-model)             | Prompt template model selector                                         |
| `kanagawa`              | bundled (`src/bundled/kanagawa.ts`, vendored theme)                                            | Theme; **replaces hotmilk footer** when on                             |

Default-on caveats: `codemcp` bootstraps a locked Python 3.13 runtime on first use (needs network); `caveman` conflicts with `defaults.language: ja`.

### Alternative skill stacks (not bundled)

hotmilk does **not** bundle [bigpowers](https://github.com/danielvm-git/bigpowers), a separate spec-driven skill stack (70+ skills, prompts, MCP). It has no `pi.extensions` entry, runs `postinstall` global symlinks, and **conflicts with gentle-pi / pioneer plan routing**. Install separately if you want that workflow instead of hotmilk's defaults:

```bash
pi install npm:bigpowers
```

Do not enable bigpowers alongside pioneer OpenSpec/Plannotator on the same task.

[latchkey](https://www.npmjs.com/package/latchkey) (API credential injection via `/skill:latchkey`) is also **not** bundled; install with `pi install npm:latchkey` if needed.

### Cursor models (optional, not bundled)

hotmilk does not ship [@netandreus/pi-cursor-provider](https://www.npmjs.com/package/@netandreus/pi-cursor-provider). Install when you route Pi through the Cursor Agent CLI:

```bash
pi install npm:@netandreus/pi-cursor-provider
agent login
# then in Pi: /model cursor/auto
```

## Development

Requires Node.js and Pi peer versions from **`package.json`** (`engines`, `peerDependencies`). This repo uses **Bun** (`bun.lock`).

```bash
bun install       # commit bun.lock; peers resolved by Bun
bun run test      # vp test (same as CI)
bun run lint
bun run format    # vp fmt --write
bun run check     # format check + lint; run bun run test separately
```

`npm install` still works with this repo’s `.npmrc` (`legacy-peer-deps=true`). This repo commits **`bun.lock`** only (no `package-lock.json`); CI uses **Bun** (`bun install --frozen-lockfile`).
