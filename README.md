# hotmilk

**hotmilk** is a Pi meta-package: one install wires gentle-pi, context-mode, graphify, subagents, and related extensions, plus user toggles in `~/.pi/agent/hotmilk.json`.

Use it when you want a practical engineering workstation without hand-picking a dozen `pi-*` packages and wiring `settings.json` yourself.

## Contents

- [What you get](#what-you-get)
- [Quick start](#quick-start)
- [Configuration](#configuration) — toggles, `/mode` groups, [workflow routing](#workflow-routing)
- [Development](#development)

## What you get

| Layer                   | Packages / assets                                                                                                                                                                                                                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Orchestration**       | [gentle-pi](https://www.npmjs.com/package/gentle-pi) **^1.2.x** (el Gentleman, SDD/OpenSpec sync, skill registry, `/gentle-ai:doctor`)                                                                                                                                                                 |
| **Context**             | [context-mode](https://www.npmjs.com/package/context-mode), [pi-observational-memory](https://www.npmjs.com/package/pi-observational-memory) (compaction continuity, default off)                                                                                                                      |
| **Codebase graph**      | [graphify-pi](https://www.npmjs.com/package/graphify-pi)                                                                                                                                                                                                                                               |
| **Subagents / actors**  | [pi-subagents](https://www.npmjs.com/package/pi-subagents), [pi-ask-user](https://www.npmjs.com/package/pi-ask-user), [pi-actors](https://www.npmjs.com/package/@llblab/pi-actors) (off by default), [pi-herdr-squad](https://www.npmjs.com/package/pi-herdr-squad) (Herdr panes only, off by default) |
| **Goals & docs**        | [pi-goal](https://www.npmjs.com/package/pi-goal), [pi-docparser](https://www.npmjs.com/package/pi-docparser)                                                                                                                                                                                           |
| **File-based planning** | [@tomxprime/planning-with-files](https://www.npmjs.com/package/@tomxprime/planning-with-files), [@plannotator/pi-extension](https://www.npmjs.com/package/@plannotator/pi-extension) (browser plan approval)                                                                                           |
| **Integrations**        | [pi-mcp-adapter](https://www.npmjs.com/package/pi-mcp-adapter), [pi-btw](https://www.npmjs.com/package/pi-btw) (side channel — see below), [@haispeed/pi-obsidian](https://www.npmjs.com/package/@haispeed/pi-obsidian)                                                                                |
| **Dashboard**           | [@blackbelt-technology/pi-agent-dashboard](https://www.npmjs.com/package/@blackbelt-technology/pi-agent-dashboard)                                                                                                                                                                                     |
| **Web tools**           | [pi-web-access](https://www.npmjs.com/package/pi-web-access)                                                                                                                                                                                                                                           |
| **Flows**               | [@blackbelt-technology/pi-flows](https://www.npmjs.com/package/@blackbelt-technology/pi-flows)                                                                                                                                                                                                         |
| **Experiment loops**    | [pi-autoresearch](https://www.npmjs.com/package/pi-autoresearch)                                                                                                                                                                                                                                       |
| **Local assets**        | `./prompts`, `./skills`, `./themes`, `mcp.json` template                                                                                                                                                                                                                                               |

Bundled extension **on/off** is controlled in `hotmilk.json` (via `/mode`), then `/reload`. Only `src/index.ts` is listed in `package.json` → `pi.extensions`; every other bundled package is loaded dynamically when its toggle is `true`.

## Quick start

### Install

```bash
pi install npm:hotmilk
```

Or add to Pi settings (`~/.pi/agent/settings.json` or project `.pi/settings.json`):

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
2. On first session, hotmilk creates `~/.pi/agent/hotmilk.json` if missing (defaults match the bundled template).
3. After config changes, run `/reload`.

### Pi 0.83 and npm peers

hotmilk targets **Pi 0.83** (`@earendil-works/pi-coding-agent` and peers). Several bundled dependencies still declare **0.74.x** peer ranges (`pi-btw`, `pi-docparser`, `@blackbelt-technology/pi-flows`, and others). npm may report `ERESOLVE` until those packages publish 0.83-compatible peers.

This repo ships **`.npmrc`** with `legacy-peer-deps=true` so `npm install` and `npm ci` succeed. Copy from `.npmrc.example` if you clone without `.npmrc`. Treat upstream extensions as **best-effort on 0.83** until their maintainers widen peer ranges.

Heavy optional stacks (`agent-dashboard`, `pi-flows`) stay **off by default**; enable in `/mode` only when you need them and accept extra peer / startup cost.

### Project trust (Pi 0.79+)

Pi gates project-local `.pi/` resources and `.agents/skills` behind **project trust** ([Pi docs](https://pi.dev/docs/latest/security#project-trust)). hotmilk registers a `project_trust` handler and, by default, defers to Pi's built-in prompt (`projectTrust.mode: "delegate"`).

Configure in `~/.pi/agent/hotmilk.json`:

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

### Commands (hotmilk)

| Command                | Purpose                                                      |
| ---------------------- | ------------------------------------------------------------ |
| `/mode`                | Toggle bundled extensions; writes `~/.pi/agent/hotmilk.json` |
| `/stop`                | Stop current running work                                    |
| `/interrupt <message>` | Steer in-flight work with an interrupt prompt                |

Upstream packages add their own commands (gentle-pi `/gentle-ai:status`, `/gentle-ai:doctor`, SDD chains, graphify, context-mode, planning-with-files `/plan-status`, plannotator `/plannotator`, and so on).

For **which plan, memory, or optimize path to use**, see [Workflow routing](#workflow-routing) (canonical matrix) and the bundled [`pioneer`](skills/pioneer/SKILL.md) skill.

## Configuration

### `~/.pi/agent/hotmilk.json`

```json
{
  "extensions": {
    "skill-registry": true,
    "sdd-init": false,
    "gentle-ai": true,
    "context-mode": true,
    "ask-user": true,
    "graphify": true,
    "shazam": false,
    "subagents": true,
    "pi-actors": false,
    "herdr-squad": false,
    "goal": true,
    "docparser": true,
    "obsidian": true,
    "btw": true,
    "simplify": true,
    "rtk-optimizer": false,
    "observational-memory": false,
    "supi-context": false,
    "mcp-adapter": false,
    "planning-with-files": false,
    "plannotator": false,
    "caveman": false,
    "red-green": false,
    "autoresearch": false,
    "agent-dashboard": false,
    "web-access": false,
    "pi-flows": false,
    "kanagawa": false,
    "prompt-template-model": false,
    "tetris": false
  },
  "graph": {
    "warnOnStale": true,
    "autoSuggestUpdate": true
  },
  "defaults": {
    "persona": "gentleman"
  },
  "mcp": {
    "seedOnStart": false
  },
  "projectTrust": {
    "mode": "delegate",
    "remember": false
  }
}
```

| Key / area                        | Behavior                                                                                                                                                                                                               |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `extensions.*`                    | Set to `false` to skip registering that bundled extension                                                                                                                                                              |
| `extensions.gentle-ai`            | Default `true`. gentle-pi **1.2.x** (bundled `^1.2.0`): orchestration, lazy SDD preflight, OpenSpec sync/archive agents, `/gentle-ai:doctor` / `:status`. hotmilk keeps **startup-banner off** (figlet header instead) |
| `extensions.subagents`            | Default `true`. Imports pi-subagents **0.28+** (~10s): acceptance gates, `timeoutMs`, resource limits. Use with `gentle-ai` for delegation; set `false` for faster startup without Task tools                          |
| `extensions.btw`                  | Default `true`. Side conversation via `/btw` while main runs. **Delegate implementation to subagents**; use BTW for quick human questions. See [pi-btw coexistence](#pi-btw-with-subagents-default-on)                 |
| `extensions.context-mode`         | Default `true`. Prefer `ctx_*` for large outputs (see project context-window rules)                                                                                                                                    |
| `extensions.observational-memory` | Default `false`. Compaction continuity; pairs with `context-mode`. See [Workflow routing](#workflow-routing)                                                                                                           |
| `extensions.shazam`               | Default `false`. Tree-sitter + LSP execute guards (`shazam_impact`, `shazam_verify`); complements graphify — see [Workflow routing](#workflow-routing)                                                                 |
| `extensions.herdr-squad`          | Default `false`. Visible read-only Herdr investigation squads (`/herdr-squad`). Requires Pi inside a Herdr-managed pane (`HERDR_ENV=1`)                                                                                |
| `extensions.rtk-optimizer`        | Default `false`. Bash/read/grep output compaction; enable with `context-mode` for leftover shell output. Install [`rtk` CLI](https://github.com/rtk-ai/rtk) for command rewrite (`/rtk verify`)                        |
| `extensions.planning-with-files`  | Default `false`. On-disk planning — see [Workflow routing](#workflow-routing)                                                                                                                                          |
| `extensions.plannotator`          | Default `false`. Browser plan approval — see [Workflow routing](#workflow-routing)                                                                                                                                     |
| `extensions.autoresearch`         | Default `false`. Optimize loop — see [Workflow routing](#workflow-routing)                                                                                                                                             |
| `extensions.goal` … `mcp-adapter` | Integration / perf extensions (formerly always loaded via `pi.extensions`; now toggled like other bundled deps)                                                                                                        |
| Enabled extensions                | Loaded **in parallel** on session start (faster than sequential import when many toggles are on)                                                                                                                       |
| `graph.warnOnStale`               | Notify when `graphify-out/needs_update` exists                                                                                                                                                                         |
| `graph.autoSuggestUpdate`         | Append `graphify update .` to that notification                                                                                                                                                                        |
| `defaults.persona`                | Seeds `.pi/gentle-ai/persona.json` when missing (`gentleman` \| `neutral`)                                                                                                                                             |
| `defaults.language`               | Appends a project language hint to the system prompt each turn                                                                                                                                                         |
| `mcp.seedOnStart`                 | Copy `mcp.json` template into `~/.pi/agent/mcp.json` when missing (empty template; for pi-mcp-adapter)                                                                                                                 |
| `projectTrust.mode`               | Pi project trust: `delegate` (default), `prompt`, `always`, or `never`                                                                                                                                                 |
| `projectTrust.remember`           | When `mode` is `always` or `never`, persist the decision in Pi `trust.json`                                                                                                                                            |
| `extensions.mcp-adapter`          | Default `false`. Enable only when you want MCP servers from `~/.pi/agent/mcp.json` (do not duplicate context-mode)                                                                                                     |

**MCP (default):** `context-mode` extension registers `ctx_*` via its built-in bridge (same module as [upstream `.pi/extensions/context-mode`](https://github.com/mksglu/context-mode/tree/main/.pi/extensions/context-mode), loaded from `build/adapters/pi/extension.js`). Hotmilk removes any `context-mode` server from `~/.pi/agent/mcp.json` when the extension is on. Enable `mcp-adapter` only for **other** MCP servers—not a second context-mode entry.

### `/mode` groups

`/mode` sections follow `BUNDLED_EXTENSION_GROUP_ORDER` in `src/config/bundled-extensions.ts`:

| Group                     | Extensions (toggle ids)                                                                                                                         |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Harness**               | `skill-registry`, `sdd-init`, `gentle-ai`                                                                                                       |
| **Agent tools**           | `ask-user`, `graphify`, `shazam`, `prompt-template-model`, `subagents`, `pi-actors`, `herdr-squad`, `agent-dashboard`, `web-access`, `pi-flows` |
| **Context & performance** | `context-mode`, `simplify`, `rtk-optimizer`, `observational-memory`, `supi-context`                                                             |
| **Integrations**          | `goal`, `docparser`, `obsidian`, `btw`, `mcp-adapter`                                                                                           |
| **Workflow**              | `planning-with-files`, `plannotator`, `red-green`                                                                                               |
| **Output**                | `caveman`, `kanagawa`                                                                                                                           |
| **Experiments**           | `autoresearch`, `tetris`                                                                                                                        |

### Workflow routing

Pick **one plan authority per task**. Memory and optimize loops are **not** plan paths — they layer beside execution. Full tie-breakers and anti-patterns: bundled [`pioneer`](skills/pioneer/SKILL.md) skill.

**Plan paths** (enable toggle → `/reload` when default off):

| When                              | Toggle / command                                     | Artifact                                     | Pioneer reference                                                            |
| --------------------------------- | ---------------------------------------------------- | -------------------------------------------- | ---------------------------------------------------------------------------- |
| Small, bounded fix                | (none) — chat `Plan:`                                | chat only                                    | [`chat-plan.md`](skills/pioneer/references/chat-plan.md)                     |
| Medium scope + browser approval   | `plannotator` → `/plannotator plans/<name>.md`       | `plans/*.md`                                 | [`plannotator-routing.md`](skills/pioneer/references/plannotator-routing.md) |
| Heavy research, `/clear` recovery | `planning-with-files` → `/skill:planning-with-files` | `task_plan.md`, `findings.md`, `progress.md` | upstream PWF skill                                                           |
| Cross-cutting, spec, >400L review | `gentle-ai` → OpenSpec SDD                           | `openspec/changes/<change>/`                 | [`openspec-routing.md`](skills/pioneer/references/openspec-routing.md)       |

**Memory layers** (supplementary — never replace plan/spec authority):

| Need                          | Prefer                                                                          |
| ----------------------------- | ------------------------------------------------------------------------------- |
| Large logs, docs, test output | `context-mode` → `ctx_*`                                                        |
| Rationale across compactions  | `observational-memory` (extra model cost; V3 needs clean session after upgrade) |
| User-readable plan files      | `planning-with-files`                                                           |
| Execute-time impact / LSP     | `shazam` (after graphify recon; not a graph replacement)                        |

Details: [`observational-memory-routing.md`](skills/pioneer/references/observational-memory-routing.md), [`shazam-routing.md`](skills/pioneer/references/shazam-routing.md).

**Optimize loops** (mutually exclusive with SDD/Plannotator on the same task):

| Need                                       | Prefer                                                       |
| ------------------------------------------ | ------------------------------------------------------------ |
| Metric optimize (bench, bundle size, loss) | `autoresearch` → `/skill:autoresearch-create`                |
| Feature delivery, spec, approval gates     | `gentle-ai` SDD or `plannotator` — keep autoresearch **off** |
| Correctness-first TDD                      | `red-green` (`/tdd`)                                         |

Stop active loops (`/autoresearch off`) before switching plan paths. Details: [`autoresearch-routing.md`](skills/pioneer/references/autoresearch-routing.md). Default shortcut `Ctrl+Shift+F` — override in `~/.pi/agent/extensions/pi-autoresearch.json`.

### Agents, skills, and scope

Pi resolves bundled assets at **user (global)**, **project**, and **package** layers. hotmilk ships package defaults; you override per machine or per repo.

| Layer             | Config                                                  | Agents (pi-subagents)                                                                         | Skills / prompts                                                                                |
| ----------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| **User (global)** | `~/.pi/agent/hotmilk.json`, `~/.pi/agent/settings.json` | `~/.pi/agent/agents/` or `~/.agents/`                                                         | User skill dirs indexed by gentle-pi `skill-registry`                                           |
| **Project**       | `.pi/settings.json`                                     | **`.pi/agents/`** (canonical); legacy `.agents/` still read                                   | `.pi/skills/`; legacy `.agents/skills/`                                                         |
| **Package**       | `pi install npm:hotmilk`                                | **`agents/` in the npm tarball** — source of truth in git, **not** auto-discovered at runtime | `package.json` → `pi.skills`, `pi.prompts`, `pi.themes` (loaded when toggles/extensions are on) |

**Precedence (same runtime name):** project → user → builtin (pi-subagents built-ins). `/run`, chains, and the `subagent` tool default to `agentScope: "both"` (user + project + builtin).

**hotmilk subagents**

- **Edit in git / npm:** `agents/*.md` — package canonical prompts (`package: hotmilk` in frontmatter → runtime name `hotmilk.coach`, `hotmilk.planner`, …).
- **Pi discovery:** copy or symlink into **`.pi/agents/`** for the project you are working in. pi-subagents reads project and user dirs only; it does not scan the installed package’s `agents/` folder.
- **Parent vs child:** the main session runs gentle-ai orchestration (delegation, SDD, skill injection). Subagents get isolated prompts; the parent stays responsible for `/run`, acceptance blocks, and routing.

After changing prompts in this repo, sync the local project overlay (often untracked):

```bash
cp agents/*.md .pi/agents/
```

Verify with `/subagents-doctor` — expect `hotmilk.*` under project agents when `.pi/agents/` is populated.

See [agents/README.md](agents/README.md) for the role map (coach, planner, coder, reviewer, …).

### Environment variables

Pi and bundled extensions read the process environment. hotmilk itself only defines **`HOTMILK_CONFIG_ROOT`**; everything else comes from Pi core or toggled bundled packages.

**Pi core** (always relevant; full list in [Pi usage — environment variables](https://pi.dev/docs/latest/usage#environment-variables)):

| Variable                      | Purpose                                                                                                  |
| ----------------------------- | -------------------------------------------------------------------------------------------------------- |
| `PI_CODING_AGENT_DIR`         | Override agent config dir (default `~/.pi/agent`). Affects `hotmilk.json`, auth, global agents, MCP path |
| `PI_CODING_AGENT_SESSION_DIR` | Override session storage (also `--session-dir`)                                                          |
| `PI_PACKAGE_DIR`              | Override package dir (Nix/Guix store paths)                                                              |
| `PI_OFFLINE`                  | Disable startup network (update checks, package checks, install telemetry)                               |
| `PI_SKIP_VERSION_CHECK`       | Skip `pi.dev` latest-version check only                                                                  |
| `PI_TELEMETRY`                | Opt in/out of install/update telemetry and provider attribution headers (`1`/`0`)                        |
| `PI_CACHE_RETENTION`          | `long` for extended prompt cache where supported                                                         |
| `PI_TIMING`                   | `1` — emit timing diagnostics                                                                            |
| `PI_HARDWARE_CURSOR`          | `1` — show hardware cursor (IME / some terminals)                                                        |
| `PI_TUI_WRITE_LOG`            | Path — log raw TUI ANSI to a file (debug)                                                                |
| `VISUAL`, `EDITOR`            | External editor for Ctrl+G                                                                               |

**LLM providers** (Pi `auth.json` → env fallback; not hotmilk-specific): common keys include `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `GOOGLE_API_KEY`, `OPENROUTER_API_KEY`, Azure (`AZURE_OPENAI_*`), Vertex (`GOOGLE_CLOUD_*`). See [@earendil-works/pi-ai](https://www.npmjs.com/package/@earendil-works/pi-ai) for the full provider table.

**hotmilk-owned**:

| Variable              | Purpose                                                                                                                        |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `HOTMILK_CONFIG_ROOT` | Override directory that contains `hotmilk.json` (default `~/.pi/agent`). Tests and sandboxes only; normal installs leave unset |

**Bundled extensions** (only when the matching `/mode` toggle is on):

| Variable                                              | Toggle / package  | Purpose                                                                                    |
| ----------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------ |
| `PI_SUBAGENT_MAX_DEPTH`                               | `subagents`       | Max nested subagent depth (default 2). Do not set `PI_SUBAGENT_DEPTH` manually             |
| `PI_SUBAGENT_INHERIT_PROJECT_CONTEXT`                 | `subagents`       | `0`/`false` — child skips project context inheritance                                      |
| `PI_SUBAGENT_INHERIT_SKILLS`                          | `subagents`       | `0`/`false` — child skips skill inheritance                                                |
| `PI_DASHBOARD_PORT`, `PI_DASHBOARD_PI_PORT`           | `agent-dashboard` | HTTP / bridge ports (hotmilk seeds **8102** when config still has upstream default `8000`) |
| `PI_DASHBOARD_ALLOW_MULTIPLE`                         | `agent-dashboard` | `1`/`true` — allow multiple dashboard processes                                            |
| `PI_DASHBOARD_URL`                                    | `agent-dashboard` | Bridge WebSocket URL (spawn sets this)                                                     |
| `PI_DASHBOARD_SPAWN_TOKEN`                            | `agent-dashboard` | Set by dashboard spawn; do not set by hand                                                 |
| `GEMINI_API_KEY`, `GOOGLE_API_KEY`                    | `graphify` (CLI)  | Semantic extraction backend for `graphify extract`                                         |
| `GRAPHIFY_GEMINI_MODEL`, `GRAPHIFY_WHISPER_MODEL`     | `graphify` (CLI)  | Override graphify LLM / Whisper model                                                      |
| `EXA_API_KEY`, `PERPLEXITY_API_KEY`, `GEMINI_API_KEY` | `web-access`      | Search / fetch keys (`~/.pi/web-search.json` also)                                         |
| `PI_ALLOW_BROWSER_COOKIES`                            | `web-access`      | `1` — allow Chromium cookie extraction for Gemini Web                                      |
| `CTX_FETCH_STRICT`                                    | `context-mode`    | `1` — stricter fetch routing in context-mode                                               |

Internal `PI_SUBAGENT_*` spawn markers (`PI_SUBAGENT_CHILD`, `PI_SUBAGENT_RUN_ID`, …) are set by pi-subagents between parent and child processes — not user configuration.

**CI / publish** (this repo only): GitHub Actions uses secret **`NPM_TOKEN`**; `setup-node` maps it to **`NODE_AUTH_TOKEN`** for `npm publish`. Local `bun publish` uses `~/.npmrc`, not `NPM_TOKEN`.

### pi-btw with subagents (default on)

Both **`subagents`** and **`btw`** default to **on**. They do not share commands or extension IDs; hotmilk loads them in parallel.

| Do this                                         | Tool                                                                                         |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Exploration, implementation, review, SDD phases | **subagents** (`Task`, `/run`, `/chain`; use `worktree: true` when running parallel writers) |
| Ask a quick question while main is working      | **`/btw`** or **`/btw:tangent`** (`Alt+/` toggles BTW ↔ main)                                |
| Bring BTW results back to the main thread       | **`/btw:inject`**                                                                            |

BTW runs a **separate** Pi session. hotmilk wraps upstream pi-btw (`src/extensions/btw.ts`):

- **`subagents: true` (default):** read-biased tools only (`read`, `grep`, `find`, `ls`, `bash`) — no main-cwd `edit`/`write`.
- **`graphify: true` + `graphify-out/graph.json`:** adds **`graphify_query`** (CLI-backed) for architecture questions.
- **`context-mode: true`:** adds **`ctx_search`** proxy to the main session knowledge base (read-only).
- Inherited prompts drop main-session harness noise (gentle-ai orchestrator, graphify rules, caveman); project AGENTS.md stays.
- Still **no** `ctx_execute`, Task, or MCP inside BTW — use main/subagents for heavy ctx work.

Global `npm:pi-btw` in Pi settings skips the hotmilk shim (standard dedupe). Prefer bundled hotmilk so BTW gets prompt/tool patches via `createAgentSession` hook.

During subagent chains, avoid BTW file edits on the main cwd; use read-only or `:tangent` until workers finish.

Set `"btw": false` in `/mode` if you want delegation only with no side channel.

### Optional extensions (off by default)

Enable in `/mode` or set the key to `true` in `hotmilk.json`, then `/reload`. Workflow-oriented toggles are summarized in [Workflow routing](#workflow-routing).

| Toggle                  | Package                                                                                                            | Notes                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `planning-with-files`   | [@tomxprime/planning-with-files](https://www.npmjs.com/package/@tomxprime/planning-with-files)                     | On-disk planning; `/skill:planning-with-files`                         |
| `plannotator`           | [@plannotator/pi-extension](https://www.npmjs.com/package/@plannotator/pi-extension)                               | `/plannotator`, `pi --plan`; ~37MB UI; `plannotator.json`              |
| `observational-memory`  | [pi-observational-memory](https://www.npmjs.com/package/pi-observational-memory)                                   | Compaction continuity; V3 = clean session after upgrade                |
| `supi-context`          | [@mrclrchtr/supi-context](https://www.npmjs.com/package/@mrclrchtr/supi-context)                                   | Context analysis & formatting; default off                             |
| `shazam`                | [pi-shazam](https://www.npmjs.com/package/pi-shazam)                                                               | `shazam_*` tools; LSP-backed verify; complements graphify              |
| `autoresearch`          | [pi-autoresearch](https://www.npmjs.com/package/pi-autoresearch)                                                   | `/autoresearch`, `.auto/`; shortcut override in `pi-autoresearch.json` |
| `caveman`               | [pi-caveman](https://www.npmjs.com/package/pi-caveman)                                                             | Terse English; conflicts with `defaults.language: ja`                  |
| `red-green`             | [pi-red-green](https://www.npmjs.com/package/pi-red-green)                                                         | `/tdd`, `/tdd-status`; `~/.pi/red-green/config.json`                   |
| `agent-dashboard`       | [@blackbelt-technology/pi-agent-dashboard](https://www.npmjs.com/package/@blackbelt-technology/pi-agent-dashboard) | Warm-start; peers **0.74** — test on 0.83                              |
| `web-access`            | [pi-web-access](https://www.npmjs.com/package/pi-web-access)                                                       | `web_search`, fetch; `~/.pi/web-search.json`                           |
| `pi-flows`              | [@blackbelt-technology/pi-flows](https://www.npmjs.com/package/@blackbelt-technology/pi-flows)                     | `/flows`; peers **0.74**                                               |
| `pi-actors`             | [@llblab/pi-actors](https://www.npmjs.com/package/@llblab/pi-actors)                                               | Local actor kernel (`spawn`, `message`, `inspect`)                     |
| `herdr-squad`           | [pi-herdr-squad](https://www.npmjs.com/package/pi-herdr-squad)                                                     | Visible read-only Herdr squads; requires `HERDR_ENV=1`                 |
| `prompt-template-model` | [pi-prompt-template-model](https://www.npmjs.com/package/pi-prompt-template-model)                                 | Prompt template model selector; default off                            |
| `kanagawa`              | [pi-kanagawa](https://www.npmjs.com/package/pi-kanagawa)                                                           | Theme; **replaces hotmilk footer** when on                             |
| `tetris`                | [pi-tetris](https://www.npmjs.com/package/pi-tetris)                                                               | `/tetris`                                                              |

### Alternative skill stacks (not bundled)

hotmilk does **not** bundle [bigpowers](https://github.com/danielvm-git/bigpowers) — a separate spec-driven skill stack (70+ skills, prompts, MCP). It has no `pi.extensions` entry, runs `postinstall` global symlinks, and **conflicts with gentle-pi / pioneer plan routing**. Install separately if you want that workflow instead of hotmilk's defaults:

```bash
pi install npm:bigpowers
```

Do not enable bigpowers alongside pioneer OpenSpec/Plannotator on the same task. See [`.agents/plans/EXTENSIONS.md`](.agents/plans/EXTENSIONS.md) §L8.

[latchkey](https://www.npmjs.com/package/latchkey) (API credential injection via `/skill:latchkey`) is also **not** bundled — install with `pi install npm:latchkey` if needed.

### Agent dashboard troubleshooting

- Run **one** dashboard process: either hotmilk warm-start (`agent-dashboard: true`) **or** manual `npm run dashboard:start`, not both.
- Keep only `"hotmilk"` in `~/.pi/agent/settings.json` `packages[]` (not a standalone dashboard extension path). Hotmilk prunes duplicate dashboard paths on session start when `agent-dashboard` is enabled.
- Hotmilk seeds dashboard HTTP port **8102** (when config still has upstream default `8000`) to avoid common port conflicts. Custom ports are preserved.
- `EADDRINUSE` on `8102` (or `9999` for pi bridge): stop the stale dashboard (`pi-dashboard stop` or `lsof -i :8102` / `:9999`), then restart Pi.
- Without `zrok` on PATH, hotmilk sets `tunnel.enabled` to `false`.
- **`ERR TypeScript loader` / jiti or tsx not found** (paths under `~/.pi-dashboard/node_modules/`): the dashboard doctor checks the legacy managed install dir and hardcodes port **8000** in its messages. Hotmilk runs on **8102** with bundled jiti from `pi-dashboard-server`. If `http://localhost:8102/api/health` returns `{"ok":true}`, the doctor error is a false positive — hotmilk logs a hint on warm-start. To silence it entirely: run **Help → Setup** once, or `npm install jiti` under `~/.pi-dashboard` after setup creates that tree.

### Cursor models (optional, not bundled)

hotmilk does not ship [@netandreus/pi-cursor-provider](https://www.npmjs.com/package/@netandreus/pi-cursor-provider). Install when you route Pi through the Cursor Agent CLI:

```bash
pi install npm:@netandreus/pi-cursor-provider
agent login
# then in Pi: /model cursor/auto
```

## Development

Requires **Node.js 22+** (or **Bun 1.3+**), **Bun** for installs in this repo, and Pi **0.83** peers in the environment.

```bash
bun install       # commit bun.lock; peers resolved by Bun
bun test          # vitest via vite-plus
bun run lint
bun run check     # lint + format + test
```

`npm install` still works if you use `.npmrc` (`legacy-peer-deps=true`) and `package-lock.json`; CI uses **Bun** only.

### CI and release

On push to `main`, GitHub Actions runs **lint + test**, then a **`publish` job** (`needs: test`) when `package.json` version is **newer than npm**. No separate workflow or tag push is required to start publish.

```text
push main → test → publish (npm publish --provenance) → git tag v<version>
```

Bump `version` in `package.json` before pushing to `main`.

**GitHub secret `NPM_TOKEN`** (required for CI publish):

1. [npm Access Tokens](https://www.npmjs.com/settings/~/tokens) → **Granular Access Token** or **Classic Automation token**
2. Scope: publish to **`hotmilk`** (or classic `publish` on the account)
3. Repository → **Settings → Secrets → Actions** → name **`NPM_TOKEN`**

CI uses [npm’s CI/CD workflow](https://docs.npmjs.com/using-private-packages-in-a-ci-cd-workflow): `actions/setup-node` with `registry-url`, then `npm publish --provenance --access public` with **`NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}`**. The secret is named `NPM_TOKEN`; `setup-node` reads **`NODE_AUTH_TOKEN`** for auth. Dependencies are **not** bundled into the tarball (`bundleDependencies` removed — npm rejected the 162 MB hard-linked bundle with `E415`).

Trusted Publisher on npm can stay configured or be removed; CI uses the token path above.

GitHub Release is optional — npm publish does not require it.

Local publish: `npm login` once, then `npm publish --access public`. Or add the token to **`~/.npmrc`** (not the repo `.npmrc`):

```bash
echo "//registry.npmjs.org/:_authToken=YOUR_NPM_TOKEN" >> ~/.npmrc
npm publish --access public
```

`bun publish` also works locally if `~/.npmrc` has a token; it does not read the `NPM_TOKEN` environment variable by itself.

### Layout

| Path                             | Role                                                                                                                                |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `src/index.ts`                   | Extension entry: config, bundled extensions, session UI, input routing                                                              |
| `src/config/hotmilk.ts`          | `hotmilk.json` load / seed / save                                                                                                   |
| `agents/`                        | Package-canonical subagent prompts (`package: hotmilk`); install into `.pi/agents/` for discovery                                   |
| `prompts/`, `skills/`, `themes/` | Shipped with the package (`pi.prompts`, `pi.skills`, `pi.themes`); workflow routing in [`skills/pioneer/`](skills/pioneer/SKILL.md) |
| `mcp.json`                       | MCP server template for local projects                                                                                              |
| `hotmilk.json`                   | Default toggle template (published in the npm package)                                                                              |

## License

[MIT](LICENSE) — Copyright (c) 2026 dayjobdoor. Bundled dependencies keep their own licenses (for example [gentle-pi](https://www.npmjs.com/package/gentle-pi) is MIT).

## Contributing

Issues and PRs are welcome. When you add an extension, skill, or workflow, document how to enable it (toggle key, settings path, or command) in this README.
