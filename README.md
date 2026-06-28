# hotmilk

**hotmilk** is a Pi meta-package: one install wires gentle-pi, context-mode, graphify, subagents, and related extensions, plus user toggles in `~/.pi/agent/hotmilk.json`.

Use it when you want a practical engineering workstation without hand-picking a dozen `pi-*` packages and wiring `settings.json` yourself.

## What you get

| Layer                   | Packages / assets                                                                                                                                                                                                       |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Orchestration**       | [gentle-pi](https://www.npmjs.com/package/gentle-pi) **≥0.4.1** (el Gentleman, SDD/OpenSpec sync, skill registry, `/gentle-ai:doctor`)                                                                                  |
| **Context**             | [context-mode](https://www.npmjs.com/package/context-mode)                                                                                                                                                              |
| **Codebase graph**      | [graphify-pi](https://www.npmjs.com/package/graphify-pi)                                                                                                                                                                |
| **Subagents**           | [pi-subagents](https://www.npmjs.com/package/pi-subagents), [pi-ask-user](https://www.npmjs.com/package/pi-ask-user)                                                                                                    |
| **Goals & docs**        | [pi-goal](https://www.npmjs.com/package/pi-goal), [pi-docparser](https://www.npmjs.com/package/pi-docparser)                                                                                                            |
| **File-based planning** | [@tomxprime/planning-with-files](https://www.npmjs.com/package/@tomxprime/planning-with-files), [@plannotator/pi-extension](https://www.npmjs.com/package/@plannotator/pi-extension) (browser plan approval)            |
| **Integrations**        | [pi-mcp-adapter](https://www.npmjs.com/package/pi-mcp-adapter), [pi-btw](https://www.npmjs.com/package/pi-btw) (side channel — see below), [@haispeed/pi-obsidian](https://www.npmjs.com/package/@haispeed/pi-obsidian) |
| **Dashboard**           | [@blackbelt-technology/pi-agent-dashboard](https://www.npmjs.com/package/@blackbelt-technology/pi-agent-dashboard)                                                                                                      |
| **Web tools**           | [pi-web-access](https://www.npmjs.com/package/pi-web-access)                                                                                                                                                            |
| **Flows**               | [@blackbelt-technology/pi-flows](https://www.npmjs.com/package/@blackbelt-technology/pi-flows)                                                                                                                          |
| **Experiment loops**    | [pi-autoresearch](https://www.npmjs.com/package/pi-autoresearch)                                                                                                                                                        |
| **Local assets**        | `./prompts`, `./skills`, `./themes`, `mcp.json` template                                                                                                                                                                |

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

### Pi 0.80 and npm peers

hotmilk targets **Pi 0.80** (`@earendil-works/pi-coding-agent` and peers). Several bundled dependencies still declare **0.74.x** peer ranges (`pi-simplify`, `pi-btw`, `pi-docparser`, `@blackbelt-technology/pi-flows`, and others). npm may report `ERESOLVE` until those packages publish 0.80-compatible peers.

This repo ships **`.npmrc`** with `legacy-peer-deps=true` so `npm install` and `npm ci` succeed. Copy from `.npmrc.example` if you clone without `.npmrc`. Treat upstream extensions as **best-effort on 0.80** until their maintainers widen peer ranges.

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

### Planning with files

Invoke when you want Manus-style on-disk planning:

```text
/skill:planning-with-files
```

Or ask Pi to use the planning-with-files skill. The extension maintains `task_plan.md`, `findings.md`, and `progress.md`. Optional: `PWF_MODE=cache-safe` or `planningWithFiles.mode` in settings (see upstream README).

### Plannotator (plan approval)

Enable `extensions.plannotator` in `/mode`, then `/reload`. Start plan mode with `/plannotator plans/<name>.md` or `pi --plan plans/<name>.md`. The agent drafts a checklist plan; you approve or annotate in the browser before execution. See upstream README for `plannotator.json` phase tuning. Default toggle is **off** (~37MB unpacked UI).

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
    "subagents": true,
    "goal": true,
    "docparser": true,
    "obsidian": true,
    "btw": true,
    "simplify": true,
    "rtk-optimizer": false,
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
    "tetris": false
  },
  "graph": {
    "warnOnStale": true,
    "autoSuggestUpdate": true
  },
  "defaults": {
    "language": "ja",
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

| Key / area                        | Behavior                                                                                                                                                                                               |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `extensions.*`                    | Set to `false` to skip registering that bundled extension                                                                                                                                              |
| `extensions.gentle-ai`            | Default `true`. gentle-pi **0.4.1+**: orchestration, lazy SDD preflight, OpenSpec sync/archive agents, `/gentle-ai:doctor` / `:status`. hotmilk keeps **startup-banner off** (figlet header instead)   |
| `extensions.subagents`            | Default `true`. Imports pi-subagents **0.28+** (~10s): acceptance gates, `timeoutMs`, resource limits. Use with `gentle-ai` for delegation; set `false` for faster startup without Task tools          |
| `extensions.btw`                  | Default `true`. Side conversation via `/btw` while main runs. **Delegate implementation to subagents**; use BTW for quick human questions. See [pi-btw coexistence](#pi-btw-with-subagents-default-on) |
| `extensions.context-mode`         | Default `true`. Prefer `ctx_*` for large outputs (see project context-window rules)                                                                                                                    |
| `extensions.rtk-optimizer`        | Default `false`. Bash/read/grep output compaction; enable with `context-mode` for leftover shell output. Install [`rtk` CLI](https://github.com/rtk-ai/rtk) for command rewrite (`/rtk verify`)        |
| `extensions.planning-with-files`  | Default `false`. Manus-style on-disk planning (`task_plan.md`, `findings.md`, `progress.md`)                                                                                                           |
| `extensions.plannotator`          | Default `false`. Browser plan approval gate (`/plannotator`, `--plan`); enable when human sign-off before execution                                                                                    |
| `extensions.autoresearch`         | Default `false`. Autonomous optimize loop (`/autoresearch`, `.auto/`). See [pi-autoresearch coexistence](#pi-autoresearch-with-gentle-ai-default-off)                                                  |
| `extensions.goal` … `mcp-adapter` | Integration / perf extensions (formerly always loaded via `pi.extensions`; now toggled like other bundled deps)                                                                                        |
| Enabled extensions                | Loaded **in parallel** on session start (faster than sequential import when many toggles are on)                                                                                                       |
| `graph.warnOnStale`               | Notify when `graphify-out/needs_update` exists                                                                                                                                                         |
| `graph.autoSuggestUpdate`         | Append `graphify update .` to that notification                                                                                                                                                        |
| `defaults.persona`                | Seeds `.pi/gentle-ai/persona.json` when missing (`gentleman` \| `neutral`)                                                                                                                             |
| `defaults.language`               | Appends a project language hint to the system prompt each turn                                                                                                                                         |
| `mcp.seedOnStart`                 | Copy `mcp.json` template into `~/.pi/agent/mcp.json` when missing (empty template; for pi-mcp-adapter)                                                                                                 |
| `projectTrust.mode`               | Pi project trust: `delegate` (default), `prompt`, `always`, or `never`                                                                                                                                 |
| `projectTrust.remember`           | When `mode` is `always` or `never`, persist the decision in Pi `trust.json`                                                                                                                            |
| `extensions.mcp-adapter`          | Default `false`. Enable only when you want MCP servers from `~/.pi/agent/mcp.json` (do not duplicate context-mode)                                                                                     |

**MCP (default):** `context-mode` extension registers `ctx_*` via its built-in bridge (same module as [upstream `.pi/extensions/context-mode`](https://github.com/mksglu/context-mode/tree/main/.pi/extensions/context-mode), loaded from `build/adapters/pi/extension.js`). Hotmilk removes any `context-mode` server from `~/.pi/agent/mcp.json` when the extension is on. Enable `mcp-adapter` only for **other** MCP servers—not a second context-mode entry.

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

Enable in `/mode` or set the key to `true` in `hotmilk.json`, then `/reload`.

| Toggle            | Package                                                                                                            | Notes                                                                                                                                                                                                                                                                                                                                                                                                         |
| ----------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `caveman`         | [pi-caveman](https://www.npmjs.com/package/pi-caveman)                                                             | Terse English (`/caveman`). Conflicts with `defaults.language: ja`                                                                                                                                                                                                                                                                                                                                            |
| `red-green`       | [pi-red-green](https://www.npmjs.com/package/pi-red-green)                                                         | TDD via `/tdd`, `/tdd-status`. Config: `~/.pi/red-green/config.json`                                                                                                                                                                                                                                                                                                                                          |
| `plannotator`     | [@plannotator/pi-extension](https://www.npmjs.com/package/@plannotator/pi-extension)                               | Browser plan approval (`/plannotator`, `pi --plan`). Planning phase restricts writes to the plan file; Approve/Deny in browser before execution. Default off (~37MB UI). Phase tuning: `~/.pi/agent/plannotator.json`. See [Plannotator (plan approval)](#plannotator-plan-approval); pioneer routing: [`skills/pioneer/references/plannotator-routing.md`](skills/pioneer/references/plannotator-routing.md) |
| `autoresearch`    | [pi-autoresearch](https://www.npmjs.com/package/pi-autoresearch)                                                   | Autonomous optimize loop (`/autoresearch`, `.auto/` session files). Skills: `autoresearch-create`, `autoresearch-finalize`, `autoresearch-hooks`. Default shortcut `Ctrl+Shift+F` — override in `~/.pi/agent/extensions/pi-autoresearch.json`. Off by default (dashboard widget + shortcuts). See [coexistence](#pi-autoresearch-with-gentle-ai-default-off)                                                  |
| `agent-dashboard` | [@blackbelt-technology/pi-agent-dashboard](https://www.npmjs.com/package/@blackbelt-technology/pi-agent-dashboard) | Warm-starts before the bridge loads (cold boot up to ~60s). Peers **0.74**; test on 0.80 before relying on it. Node.js ≥ 22.18                                                                                                                                                                                                                                                                                |
| `web-access`      | [pi-web-access](https://www.npmjs.com/package/pi-web-access)                                                       | `web_search`, fetch, GitHub clone, PDF/video. Optional keys: `~/.pi/web-search.json`                                                                                                                                                                                                                                                                                                                          |
| `pi-flows`        | [@blackbelt-technology/pi-flows](https://www.npmjs.com/package/@blackbelt-technology/pi-flows)                     | YAML DAG workflows (`/flows`). Peers **0.74** + `@sinclair/typebox`; off by default on 0.80 stacks                                                                                                                                                                                                                                                                                                            |
| `kanagawa`        | [pi-kanagawa](https://www.npmjs.com/package/pi-kanagawa)                                                           | Kanagawa theme (also in `/theme` via shipped assets), wave animation, `/thinking`. **Replaces hotmilk footer** when on                                                                                                                                                                                                                                                                                        |
| `tetris`          | [pi-tetris](https://www.npmjs.com/package/pi-tetris)                                                               | Play Tetris with `/tetris`. Lightweight; default off                                                                                                                                                                                                                                                                                                                                                          |

### pi-autoresearch with gentle-ai (default off)

`autoresearch` lives under the **Experiments** group in `/mode` (with `tetris`). Enable when the task is a **measure → edit → benchmark → keep/discard** loop, not feature delivery.

| Task shape                                                 | Prefer                                                                     |
| ---------------------------------------------------------- | -------------------------------------------------------------------------- |
| Optimize metric (test time, bundle size, loss, Lighthouse) | `autoresearch: true` → `/skill:autoresearch-create` or `/autoresearch`     |
| Feature, spec, cross-cutting, review >400 lines            | `gentle-ai` + OpenSpec/SDD — keep `autoresearch` off                       |
| Human plan approval before writes                          | `plannotator` — not autoresearch as plan authority                         |
| Strict correctness-first test cycle                        | `red-green` (`/tdd`) — autoresearch only when optimizing the metric itself |

**Do not run SDD phases and an active autoresearch loop on the same task.** Stop the loop (`/autoresearch off`) before `/sdd-continue` or Plannotator approval work. Pioneer routing: [`skills/pioneer/references/autoresearch-routing.md`](skills/pioneer/references/autoresearch-routing.md).

**Shortcut conflicts:** default fullscreen dashboard is `Ctrl+Shift+F`. Override or disable in `~/.pi/agent/extensions/pi-autoresearch.json`:

```json
{
  "shortcuts": {
    "fullscreenDashboard": "ctrl+shift+y"
  }
}
```

Use `null` for a shortcut key to skip registration.

**Agent dashboard troubleshooting**

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

Requires **Node.js 22+** (or **Bun 1.3+**), **Bun** for installs in this repo, and Pi **0.80** peers in the environment.

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

| Path                             | Role                                                                                              |
| -------------------------------- | ------------------------------------------------------------------------------------------------- |
| `src/index.ts`                   | Extension entry: config, bundled extensions, session UI, input routing                            |
| `src/config/hotmilk.ts`          | `hotmilk.json` load / seed / save                                                                 |
| `agents/`                        | Package-canonical subagent prompts (`package: hotmilk`); install into `.pi/agents/` for discovery |
| `prompts/`, `skills/`, `themes/` | Shipped with the package (`pi.prompts`, `pi.skills`, `pi.themes`)                                 |
| `mcp.json`                       | MCP server template for local projects                                                            |
| `hotmilk.json`                   | Default toggle template (published in the npm package)                                            |

## License

[MIT](LICENSE) — Copyright (c) 2026 dayjobdoor. Bundled dependencies keep their own licenses (for example [gentle-pi](https://www.npmjs.com/package/gentle-pi) is MIT).

## Contributing

Issues and PRs are welcome. When you add an extension, skill, or workflow, document how to enable it (toggle key, settings path, or command) in this README.
