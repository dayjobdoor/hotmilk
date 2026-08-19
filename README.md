# hotmilk

**hotmilk** is a Pi meta-package: one install wires gentle-pi, context-mode, graphify, subagents, and related extensions, plus user toggles in `$PI_CODING_AGENT_DIR/hotmilk.json` (Pi agent dir — see [Configuration](#configuration)).

Use it when you want a practical engineering workstation without hand-picking a dozen `pi-*` packages and wiring `settings.json` yourself.

## Contents

- [What you get](#what-you-get)
- [Quick start](#quick-start)
- [Configuration](#configuration) — toggles, `/mode` groups, [workflow routing](#workflow-routing)
- [Development](#development)
- [Documentation map](#documentation-map)

## What you get

| Layer                   | Packages / assets                                                                                                                                                                                                                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Orchestration**       | [gentle-pi](https://www.npmjs.com/package/gentle-pi) (el Gentleman, SDD/OpenSpec sync, skill registry, `/gentle-ai:doctor`)                                                                                                                                                                 |
| **Context**             | [context-mode](https://www.npmjs.com/package/context-mode), [pi-simplify](https://www.npmjs.com/package/pi-simplify), [pi-rtk-optimizer](https://www.npmjs.com/package/pi-rtk-optimizer) (default off), [pi-observational-memory](https://www.npmjs.com/package/pi-observational-memory) (default off) |
| **Codebase graph**      | [graphify-pi](https://www.npmjs.com/package/graphify-pi) (default on); optional [pi-shazam](https://www.npmjs.com/package/pi-shazam) (default off)                                                                      |
| **Subagents**           | [pi-subagents](https://www.npmjs.com/package/pi-subagents), [pi-ask-user](https://www.npmjs.com/package/pi-ask-user), [pi-herdr-squad](https://www.npmjs.com/package/pi-herdr-squad) (Herdr panes only, off by default)                                                                                |
| **Goals & docs**        | [pi-goal](https://www.npmjs.com/package/pi-goal) (default off), [pi-docparser](https://www.npmjs.com/package/pi-docparser)                                                                                                                                                                                           |
| **File-based planning** | [@tomxprime/planning-with-files](https://www.npmjs.com/package/@tomxprime/planning-with-files) (default off), [@plannotator/pi-extension](https://www.npmjs.com/package/@plannotator/pi-extension) (browser plan approval, default off)                                                                                           |
| **Integrations**        | [pi-mcp-adapter](https://www.npmjs.com/package/pi-mcp-adapter) (default off), [pi-btw](https://www.npmjs.com/package/pi-btw) (side channel — see below), [@haispeed/pi-obsidian](https://www.npmjs.com/package/@haispeed/pi-obsidian)                                                                                |
| **Web tools**           | [pi-web-access](https://www.npmjs.com/package/pi-web-access) (default off)                                                                                                                                                                                                                                           |
| **Search tools**        | [@ff-labs/pi-fff](https://www.npmjs.com/package/@ff-labs/pi-fff) (replaces built-in find/grep, default off) |
| **Experiment loops**    | [pi-autoresearch](https://www.npmjs.com/package/pi-autoresearch) (default off)                                                                                                                                                                                                                                       |
| **Output style**        | [pi-caveman](https://www.npmjs.com/package/pi-caveman) / [pi-kanagawa](https://www.npmjs.com/package/pi-kanagawa) (default off); optional [@dietrichgebert/ponytail](https://www.npmjs.com/package/@dietrichgebert/ponytail) (lazy-senior mode, default off)
| **Local assets**        | `./prompts`, `./skills`, `./themes`, `mcp.json` template                                                                                                                                                                                                                                               |

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
2. On first session, hotmilk creates `$PI_CODING_AGENT_DIR/hotmilk.json` if missing (defaults match the bundled template).
3. After config changes, run `/reload`.

### Pi and npm peers

Peer ranges live in **`package.json` → `peerDependencies`**. Some bundled dependencies still declare **narrow peer ranges** that disagree with hotmilk’s Pi peers (`pi-kanagawa` peers on the `@mariozechner/*` namespace). npm may report `ERESOLVE` until those packages publish wider peers.

This repo ships **`.npmrc`** with `legacy-peer-deps=true` so `npm install` and `npm ci` succeed. Copy from `.npmrc.example` if you clone without `.npmrc`. Treat upstream extensions as **best-effort** until their maintainers widen peer ranges.

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

### Commands (hotmilk)

| Command                | Purpose                                                      |
| ---------------------- | ------------------------------------------------------------ |
| `/mode`                | Toggle bundled extensions; writes `$PI_CODING_AGENT_DIR/hotmilk.json` |
| `/stop`                | Stop current running work                                    |
| `/interrupt <message>` | Steer in-flight work with an interrupt prompt                |
| `/subagents-doctor`    | When `subagents` is on: doctor report (hotmilk registers this in `src/bootstrap/subagents-doctor.ts`) |

Upstream packages add their own commands (gentle-pi `/gentle-ai:status`, `/gentle-ai:doctor`, SDD chains, graphify, context-mode, planning-with-files `/plan-status`, plannotator `/plannotator`, and so on).

For **which plan, memory, or optimize path to use**, see [Workflow routing](#workflow-routing) (canonical matrix) and the bundled [`pioneer`](skills/pioneer/SKILL.md) skill.

## Configuration

**Pi agent directory:** `$PI_CODING_AGENT_DIR` when set, otherwise `~/.pi/agent`. Pi and hotmilk resolve the same path (`getAgentDir()`). Paths below use `$PI_CODING_AGENT_DIR/…`.

### `$PI_CODING_AGENT_DIR/hotmilk.json`

```json
{
  "extensions": {
    "skill-registry": true,
    "sdd-init": true,
    "gentle-ai": false,
    "context-mode": true,
    "ask-user": true,
    "graphify": true,
    "shazam": false,
    "subagents": false,
    "herdr-squad": false,
    "goal": false,
    "docparser": true,
    "obsidian": true,
    "btw": true,
    "simplify": true,
    "rtk-optimizer": false,
    "observational-memory": false,
    "mcp-adapter": true,
    "planning-with-files": false,
    "plannotator": true,
    "caveman": true,
    "ponytail": true,
    "red-green": false,
    "autoresearch": false,
    "web-access": true,
    "fff": false,
    "kanagawa": false,
    "prompt-template-model": false
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
| `extensions.gentle-ai`            | Default `false`. gentle-pi: orchestration, lazy SDD preflight, OpenSpec sync/archive agents, `/gentle-ai:doctor` / `:status`. hotmilk keeps **startup-banner off** (figlet header instead) |
| `extensions.subagents`            | Default `false`. pi-subagents: acceptance gates, `timeoutMs`, resource limits. Use with `gentle-ai` for delegation; set `false` for faster startup without Task tools             |
| `extensions.btw`                  | Default `true`. Side conversation via `/btw` while main runs. **Delegate implementation to subagents**; use BTW for quick human questions. See [pi-btw coexistence](#pi-btw-with-subagents-default-on)                 |
| `extensions.context-mode`         | Default `true`. Prefer `ctx_*` for large outputs (see project context-window rules)                                                                                                                                    |
| `extensions.observational-memory` | Default `false`. Compaction continuity; pairs with `context-mode`. See [Workflow routing](#workflow-routing)                                                                                                           |
| `extensions.shazam`               | Default `false`. Tree-sitter + LSP execute guards (`shazam_impact`, `shazam_verify`); complements graphify — see [Workflow routing](#workflow-routing)                                                                 |
| `extensions.herdr-squad`          | Default `false`. Visible read-only Herdr investigation squads (`/herdr-squad`). Requires Pi inside a Herdr-managed pane (`HERDR_ENV=1`)                                                                                |
| `extensions.rtk-optimizer`        | Default `false`. Bash/read/grep output compaction; enable with `context-mode` for leftover shell output. Install [`rtk` CLI](https://github.com/rtk-ai/rtk) for command rewrite (`/rtk verify`)                        |
| `extensions.planning-with-files`  | Default `false`. On-disk planning — see [Workflow routing](#workflow-routing)                                                                                                                                          |
| `extensions.plannotator`          | Default `true`. Browser plan approval — see [Workflow routing](#workflow-routing)                                                                                                                                     |
| `extensions.autoresearch`         | Default `false`. Optimize loop — see [Workflow routing](#workflow-routing)                                                                                                                                             |
| `extensions.goal` … `mcp-adapter` | Integration / perf extensions (formerly always loaded via `pi.extensions`; now toggled like other bundled deps)                                                                                                        |
| Enabled extensions                | `context-mode` / `rtk-optimizer` load first (context stack), then `btw`, then remaining enabled extensions **in parallel**                                                                                                                       |
| `graph.warnOnStale`               | Notify when `graphify-out/needs_update` exists                                                                                                                                                                         |
| `graph.autoSuggestUpdate`         | Append `graphify update .` to that notification                                                                                                                                                                        |
| `defaults.persona`                | Seeds `.pi/gentle-ai/persona.json` when missing (`gentleman` \| `neutral`)                                                                                                                                             |
| `defaults.language`               | Appends a project language hint to the system prompt each turn                                                                                                                                                         |
| `mcp.seedOnStart`                 | Copy `mcp.json` template into `$PI_CODING_AGENT_DIR/mcp.json` when missing (empty template; for pi-mcp-adapter)                                                                                                                 |
| `projectTrust.mode`               | Pi project trust: `delegate` (default), `prompt`, `always`, or `never`                                                                                                                                                 |
| `projectTrust.remember`           | When `mode` is `always` or `never`, persist the decision in Pi `trust.json`                                                                                                                                            |
| `extensions.mcp-adapter`          | Default `true`. Enable only when you want MCP servers from `$PI_CODING_AGENT_DIR/mcp.json` (do not duplicate context-mode)                                                                                                     |

**MCP (default):** `context-mode` extension registers `ctx_*` via its built-in bridge (same module as [upstream `.pi/extensions/context-mode`](https://github.com/mksglu/context-mode/tree/main/.pi/extensions/context-mode), loaded from `build/adapters/pi/extension.js`). Hotmilk removes any `context-mode` server from `$PI_CODING_AGENT_DIR/mcp.json` when the extension is on. Enable `mcp-adapter` only for **other** MCP servers—not a second context-mode entry.

### `/mode` groups

`/mode` sections follow `BUNDLED_EXTENSION_GROUP_ORDER` in `src/config/bundled-extensions.ts`:

| Group                     | Extensions (toggle ids)                                                                                          |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Harness**               | `skill-registry`, `sdd-init`, `gentle-ai`                                                                        |
| **Agent tools**           | `ask-user`, `graphify`, `shazam`, `prompt-template-model`, `subagents`, `herdr-squad`, `fff`, `web-access` |
| **Context & performance** | `context-mode`, `simplify`, `rtk-optimizer`, `observational-memory`                                 |
| **Integrations**          | `goal`, `docparser`, `obsidian`, `btw`, `mcp-adapter`                                                            |
| **Workflow**              | `planning-with-files`, `plannotator`, `red-green`                                    |
| **Output**                | `caveman`, `ponytail`, `kanagawa`                                                                   |
| **Experiments**           | `autoresearch`                                                                                                   |

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

| Need                           | Prefer                                                                          |
| ------------------------------ | ------------------------------------------------------------------------------- |
| Large logs, docs, test output  | `context-mode` → `ctx_*`                                                        |
| Rationale across compactions   | `observational-memory` (extra model cost; V3 needs clean session after upgrade) |
| User-readable plan files       | `planning-with-files`                                                           |
| Execute-time impact / LSP      | `shazam` (after graphify recon; complements graphify)                           |

Details: [`observational-memory-routing.md`](skills/pioneer/references/observational-memory-routing.md), [`shazam-routing.md`](skills/pioneer/references/shazam-routing.md).

**Optimize loops** (mutually exclusive with SDD/Plannotator on the same task):

| Need                                       | Prefer                                                       |
| ------------------------------------------ | ------------------------------------------------------------ |
| Metric optimize (bench, bundle size, loss) | `autoresearch` → `/skill:autoresearch-create`                |
| Feature delivery, spec, approval gates     | `gentle-ai` SDD or `plannotator` — keep autoresearch **off** |
| Correctness-first TDD                      | `red-green` (`/tdd`)                                         |

Stop active loops (`/autoresearch off`) before switching plan paths. Details: [`autoresearch-routing.md`](skills/pioneer/references/autoresearch-routing.md). Default shortcut `Ctrl+Shift+F` — override in `$PI_CODING_AGENT_DIR/extensions/pi-autoresearch.json`.

### Agents, skills, and scope

Pi resolves bundled assets at **user (global)**, **project**, and **package** layers. hotmilk ships package defaults; you override per machine or per repo.

| Layer             | Config                                                  | Agents (pi-subagents)                                                                         | Skills / prompts                                                                                              |
| ----------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **User (global)** | `$PI_CODING_AGENT_DIR/hotmilk.json`, `$PI_CODING_AGENT_DIR/settings.json` | `$PI_CODING_AGENT_DIR/agents/` or `~/.agents/`                                                         | User skill dirs indexed by gentle-pi `skill-registry`                                                         |
| **Project**       | `.pi/settings.json`                                     | **`.pi/agents/`** (canonical); legacy `.agents/` still read                                   | `.pi/skills/`; legacy `.agents/skills/`                                                                       |
| **Package**       | `pi install npm:hotmilk`                                | **`agents/` in the npm tarball** — source of truth in git, **not** auto-discovered at runtime | `package.json` → `pi.skills`, `pi.prompts`, `pi.themes` (always indexed; extension toggles do not gate these) |

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


### Environment variables

Pi and bundled extensions read the process environment. hotmilk honors **`PI_CODING_AGENT_DIR`** for `hotmilk.json` and global extension dedupe (same agent dir as Pi). **`HOTMILK_CONFIG_ROOT`** overrides that for tests/sandboxes.

**Pi core** (always relevant; full list in [Pi usage — environment variables](https://pi.dev/docs/latest/usage#environment-variables)):

| Variable                      | Purpose                                                                                                  |
| ----------------------------- | -------------------------------------------------------------------------------------------------------- |
| `PI_CODING_AGENT_DIR`         | Override agent config dir (default `~/.pi/agent`). hotmilk uses this for `hotmilk.json`, global settings dedupe, and MCP path |
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
| `HOTMILK_CONFIG_ROOT` | Test/sandbox override for the directory that contains `hotmilk.json`. Wins over `PI_CODING_AGENT_DIR`. Normal installs leave unset |

**Bundled extensions** (only when the matching `/mode` toggle is on):

| Variable                                              | Toggle / package | Purpose                                                                        |
| ----------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------ |
| `PI_SUBAGENT_MAX_DEPTH`                               | `subagents`      | Max nested subagent depth (default 2). Do not set `PI_SUBAGENT_DEPTH` manually |
| `PI_SUBAGENT_INHERIT_PROJECT_CONTEXT`                 | `subagents`      | `0`/`false` — child skips project context inheritance                          |
| `PI_SUBAGENT_INHERIT_SKILLS`                          | `subagents`      | `0`/`false` — child skips skill inheritance                                    |
| `GEMINI_API_KEY`, `GOOGLE_API_KEY`                    | `graphify` (CLI) | Semantic extraction backend for `graphify extract`                             |
| `GRAPHIFY_GEMINI_MODEL`, `GRAPHIFY_WHISPER_MODEL`     | `graphify` (CLI) | Override graphify LLM / Whisper model                                          |
| `EXA_API_KEY`, `PERPLEXITY_API_KEY`, `GEMINI_API_KEY` | `web-access`     | Search / fetch keys (`~/.pi/web-search.json` also)                             |
| `PI_ALLOW_BROWSER_COOKIES`                            | `web-access`     | `1` — allow Chromium cookie extraction for Gemini Web                          |
| `CTX_FETCH_STRICT`                                    | `context-mode`   | `1` — stricter fetch routing in context-mode                                   |
…
Issues and PRs are welcome. When you add an extension, skill, or workflow, document how to enable it (toggle key, settings path, or command) in this README.
…
309:[Showing lines 1-300 of 446. Use :301 to continue]

[Showing lines 1-300 of 309. Use :301 to continue]