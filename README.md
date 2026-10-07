# hotmilk

hotmilk is a Pi meta-package. One install brings gentle-pi, context-mode, graphify, subagents, and about two dozen other `pi-*` extensions, each behind a toggle in `$PI_CODING_AGENT_DIR/hotmilk.json` (see [Configuration](#configuration)). Every extension starts off. You switch on the ones you use with `/mode`, and you do not have to hand-pick packages or wire `settings.json` yourself.

Requires Pi 1.0 or later and Node.js 22.19+. Also runs on [omp](#harnesses-pi-omp-openclaw) (22 of 28 extensions).

## Contents

- [What you get](#what-you-get)
- [Quick start](#quick-start) and [upgrading from 0.1.x](#upgrading-from-01x)
- [Configuration](#configuration): toggles, `/mode` groups, [workflow routing](#workflow-routing)
- [Development](#development), [contributing](#contributing), [license](#license)
- [Documentation map](docs/guidance.md)

## What you get

| Layer                       | Packages / assets                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Orchestration           | [gentle-pi](https://www.npmjs.com/package/gentle-pi) (el Gentleman orchestration and review, skill registry, `/gentle:doctor`) |
| Context                 | [context-mode](https://www.npmjs.com/package/context-mode), [pi-context-view](https://www.npmjs.com/package/pi-context-view), [@sting8k/pi-vcc](https://www.npmjs.com/package/@sting8k/pi-vcc), [pi-simplify](https://www.npmjs.com/package/pi-simplify), [pi-rtk-optimizer](https://www.npmjs.com/package/pi-rtk-optimizer), [pi-observational-memory](https://www.npmjs.com/package/pi-observational-memory)                                                              |
| Codebase graph          | [@runecraft/graphify-pi](https://www.npmjs.com/package/@runecraft/graphify-pi) (`graphify_build/query/path/explain/update` tools over the [graphify](https://github.com/Graphify-Labs/graphify) CLI); optional [pi-shazam](https://www.npmjs.com/package/pi-shazam)                                                                                                                                                                                                                                                                                                                                                                                  |
| Subagents & interaction | `subagents` = gentle-pi's `gentle-agents` module (the `subagent_*` tools gentle-ai's delegation calls; `/gentle:agents`), [pi-prompt-template-model](https://www.npmjs.com/package/pi-prompt-template-model) (`/chain-prompts`, `/prompt-tool`), [@juicesharp/rpiv-ask-user-question](https://www.npmjs.com/package/@juicesharp/rpiv-ask-user-question), [@juicesharp/rpiv-todo](https://www.npmjs.com/package/@juicesharp/rpiv-todo), [pi-intercom](https://www.npmjs.com/package/pi-intercom), [pi-lens](https://www.npmjs.com/package/pi-lens), [gentle-engram](https://www.npmjs.com/package/gentle-engram) |
| Goals & docs            | [pi-goal-x](https://www.npmjs.com/package/pi-goal-x) (`/goal`, `/goal-direct`, `/sisyphus`), [pi-docparser](https://www.npmjs.com/package/pi-docparser)                                                                                                                                                                                                                                                                                                                                          |
| File-based planning     | [@tomxprime/planning-with-files](https://www.npmjs.com/package/@tomxprime/planning-with-files) (`/plan-*` commands only; hotmilk does not index its skill), [@plannotator/pi-extension](https://www.npmjs.com/package/@plannotator/pi-extension) (browser plan approval)                                                                                                                                                                                                                                                                                                          |
| Integrations            | [pi-btw](https://www.npmjs.com/package/pi-btw) (side questions; see below)                                                                                                                                                                                                                                             |
| Web tools               | [pi-web-access](https://www.npmjs.com/package/pi-web-access)                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Search tools            | [@ff-labs/pi-fff](https://www.npmjs.com/package/@ff-labs/pi-fff) (replaces built-in find/grep)                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Experiment loops        | [pi-autoresearch](https://www.npmjs.com/package/pi-autoresearch)                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Output style            | [pi-caveman](https://www.npmjs.com/package/pi-caveman), [@dietrichgebert/ponytail](https://www.npmjs.com/package/@dietrichgebert/ponytail) (lazy-senior mode); bundled kanagawa theme                                                                                                                                                                                                                                                                                               |
| Local assets            | `./prompts`, `./skills` (`pioneer`, `comfortzone`), `./themes`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

Bundled extensions switch on and off in `hotmilk.json` (via `/mode`), then `/reload`. Only `src/index.ts` is listed in `package.json` → `pi.extensions`; every other bundled package loads dynamically when its toggle is `true`. Every bundled extension defaults off (0.2.0 minimal core), so a fresh install runs the hotmilk theme, footer, `/mode`, and the indexed skills and prompts only. An existing `hotmilk.json` keeps its saved toggles. Pi always indexes the package's `pi.skills`, `pi.prompts`, and `pi.themes` paths; `/mode` toggles do not gate them.

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

For one project only (written to `.pi/settings.json`):

```bash
pi install -l npm:hotmilk
```

From a local checkout:

```bash
pi install ./path/to/hotmilk
```

### First run

1. Open a project directory in Pi. A short hotmilk intro animation plays, then the footer remains; no bundled extension is loaded yet.
2. On first session, hotmilk creates `$PI_CODING_AGENT_DIR/hotmilk.json` if missing.
3. Run `/mode`, switch on the extensions you want (start with `context-mode`, `todo`, `subagents`), then `/reload`.

The same thing by hand, in `hotmilk.json`:

```json
{
  "extensions": { "context-mode": true, "todo": true, "subagents": true }
}
```

Per-extension notes and combination rules: [docs/bundles.md](docs/bundles.md).

### Upgrading from 0.1.x

0.2.0 is a minimal-core release.

- Every extension is off by default now. A `hotmilk.json` you saved keeps its values; extensions it has no value for are off. The first 0.2.0 session lists the formerly default-on ones you lost, once, and records that in `notices.defaultOff020`. Turn them back on with `/mode`, then `/reload`.
- Requires Pi 1.0 (gentle-pi 4, `@earendil-works/pi-*` 1.x).
- Removed rows: `sdd-init` (gone from gentle-pi 4), `mcp-adapter` and `codemcp` (Pi 1.0 has built-in MCP; hotmilk no longer touches `mcp.json`), `herdr-squad`, and `openspec-context`. Stale keys in `hotmilk.json` are ignored.
- `subagents` now loads gentle-pi's `gentle-agents` (same `subagent_*` tools, plus `/gentle:agents`); uninstall `pi-subagents-j0k3r` from Pi settings if you have it. `/subagents-doctor` is gone.
- `btw` is plain upstream pi-btw: hotmilk's prompt shaping and proxy tools are retired ([details](#pi-btw-side-questions)).

### Pi and npm peers

Peer ranges live in `package.json` → `peerDependencies`. Some bundled dependencies still declare narrow peer ranges that disagree with hotmilk's Pi peers (on Pi 1.0 today: `pi-lens` stops at `pi-tui` 0.85 and `pi-rtk-optimizer` stops at 0.80; all load fine, and CI tracks them in [third-party-risk.test.ts](test/third-party-risk.test.ts)). npm may report `ERESOLVE` until those packages publish wider peers.

This repo ships `.npmrc` with `legacy-peer-deps=true` so `npm install` and `npm ci` succeed. Treat upstream extensions as best-effort until their maintainers widen peer ranges.

### Harnesses (pi, omp, OpenClaw)

hotmilk detects its host at startup from `CONFIG_DIR_NAME` in `@earendil-works/pi-coding-agent`:

| Host | Status |
| ---- | ------ |
| [Pi](https://pi.dev) | Full support: bundled extensions load per `/mode` toggle |
| [omp](https://github.com/can1357/oh-my-pi) (oh-my-pi) | Supported on omp 18.4.10 (`OMP_AUDITED_VERSION`, CI-audited): hotmilk commands register and the 22 rows flagged `omp: true` load; the other 6 are skipped with a session-start warning and labeled `(pi only)` in `/mode`. Other omp releases work best-effort with a warning. Contract and per-row status: [docs/bundles.md](docs/bundles.md#omp-support). omp stubs `setFooter`, so the hotmilk footer does not render. `hotmilk.json` lives in omp's agent dir (default `~/.omp/agent`). Load with `omp -e <path-to-hotmilk>` or an omp `extensions` setting |
| [OpenClaw](https://github.com/openclaw/openclaw) | Not supported: OpenClaw loads only `openclaw.extensions` / native plugins, never `pi.extensions` |

### Project trust

Pi gates project-local `.pi/` resources and `.agents/skills` behind project trust ([Pi docs](https://pi.dev/docs/latest/security#project-trust)). hotmilk registers a `project_trust` handler and, by default, defers to Pi's built-in prompt (`projectTrust.mode: "delegate"`).

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

On startup, hotmilk scans only global Pi settings for bundled-extension dedupe. After trust, project `.pi/settings.json` duplicates are reported; run `/reload` to dedupe.

When a hotmilk repo checkout (project package) and a globally installed `npm:hotmilk` would both load, the npm-installed copy yields and the project copy owns registration (project → user precedence). An installed release yields only once it carries this guard; until then, in-repo sessions report duplicate-tool diagnostics. To develop in-repo without them today, launch with a clean agent dir (`PI_CODING_AGENT_DIR=$(mktemp -d) pi`) so only the project copy loads (config seeds on first run).

### Commands (hotmilk)

| Command                | Purpose                                                                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `/mode`                | Toggle persona (`gentleman` / `neutral` / `gyal` / `raiden`) and bundled extensions; writes `$PI_CODING_AGENT_DIR/hotmilk.json` |
| `/stop`                | Stop current running work                                                                                                       |
| `/interrupt <message>` | Steer in-flight work with an interrupt prompt                                                                                   |
| `/pioneer [task]`      | Alias for `/skill:pioneer` (queued as follow-up while work runs)                                                                |

Upstream packages add their own commands (gentle-pi `/gentle:status`, `/gentle:doctor`, graphify, context-mode, planning-with-files `/plan-status`, plannotator `/plannotator`, and so on).

For how a change runs (W-model: test design per level, bottom-up execution), see [Workflow routing](#workflow-routing) and the bundled [`pioneer`](skills/pioneer/SKILL.md) skill.

## Configuration

Pi agent directory: `$PI_CODING_AGENT_DIR` when set, otherwise `~/.pi/agent`. Pi and hotmilk resolve the same path (`getAgentDir()`). Paths below use `$PI_CODING_AGENT_DIR/…`.

### `$PI_CODING_AGENT_DIR/hotmilk.json`

Bundled extension defaults live in [`src/config/bundled-extensions.ts`](src/config/bundled-extensions.ts). `hotmilk.json` stores user overrides and non-extension defaults; edit it with `/mode`, then run `/reload` to apply extension changes.

| Key / area                        | Behavior                                                                                                                                                                                               |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `extensions.*`                    | Set to `true` to register that bundled extension (every id defaults `false`). Per-row notes, omp support, and recommendations: [docs/bundles.md](docs/bundles.md)                                                                                                                                             |
| Enabled extensions                | `context-mode` / `rtk-optimizer` load first (context stack), then all other enabled extensions in parallel.             |
| `graph.warnOnStale`               | Notify when `graphify-out/needs_update` exists                                                                                                                                                         |
| `graph.autoSuggestUpdate`         | Append `graphify update .` to that notification                                                                                                                                                        |
| `defaults.persona`                | `/mode` picker; `hotmilk.json` stays authoritative; the gentle-pi marker (`.pi/gentle-ai/persona.json`) is reconciled at session start. Supported: `gentleman`, `neutral`, `gyal`, `raiden`; default `neutral`. `gyal`/`raiden` replace gentle-pi's persona section (or append their own when `gentle-ai` is off); `gentleman` needs `gentle-ai` on. |
| `defaults.language`               | Appends a project language hint to the system prompt each turn                                                                                                                                         |
| `projectTrust.mode`               | Pi project trust: `delegate` (default), `prompt`, `always`, or `never`                                                                                                                                 |
| `projectTrust.remember`           | When `mode` is `always` or `never`, persist the decision in Pi `trust.json`                                                                                                                            |
| `notices.defaultOff020`           | Written by hotmilk after it tells you once which formerly default-on rows are now off (0.2.0); you never need to set it                                                                              |

context-mode: the extension registers `ctx_*` via its built-in bridge (same module as [upstream `.pi/extensions/context-mode`](https://github.com/mksglu/context-mode/tree/main/.pi/extensions/context-mode), loaded from `build/adapters/pi/extension.js`). hotmilk does not manage `mcp.json` or bundle an MCP adapter: Pi 1.0 has built-in MCP (`pi mcp add`, `/mcp`, [docs](https://pi.dev/docs/latest/mcp)), and omp reads its own `mcp.json`. Do not also list `context-mode` as an MCP server there; that registers `ctx_*` twice.

### `/mode` groups

`/mode` renders groups from `BUNDLED_EXTENSION_GROUP_ORDER` in [`src/config/bundled-extensions.ts`](src/config/bundled-extensions.ts).

### Workflow routing

The bundled [`pioneer`](skills/pioneer/SKILL.md) skill runs each change as a roadmap-anchored W-model. The change starts from a [ROADMAP.md](ROADMAP.md) horizon item, with sequencing gates respected. Every level (requirements, system design, detailed design, code) gets its test design and review gate before the next. Tests run bottom-up, each failure goes back to the level that caused it, and the roadmap is synced on close. The skill works in any repository and depends on no bundled extension; `plannotator` and `planning-with-files` stay optional paths outside it. Memory and optimize loops layer beside execution. [`comfortzone`](skills/comfortzone/SKILL.md) applies TCZ to the agent: coach it toward a goal, or let it self-coach when work stalls.

### Skills and scope

Pi resolves assets at user (global), project, and package layers. hotmilk ships package defaults; you override per machine or per repo. hotmilk ships no subagent prompts: its change-flow practice lives in the [`pioneer`](skills/pioneer/SKILL.md) skill (`/pioneer` or `/skill:pioneer`).

| Layer             | Config                                                                    | Skills / prompts                                                                                              |
| ----------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| User (global) | `<agent dir>/hotmilk.json`, `<agent dir>/settings.json`                   | User skill dirs indexed by gentle-pi `skill-registry`                                                         |
| Project       | `.pi/settings.json` (omp: `.omp/`)                                        | `.pi/skills/`; legacy `.agents/skills/`                                                                       |
| Package       | `pi install npm:hotmilk`                                                  | `package.json` → `pi.skills`, `pi.prompts`, `pi.themes` (always indexed; extension toggles do not gate these) |

### Environment variables

Pi and bundled extensions read the process environment. hotmilk never reads directory variables itself: it asks the host through `getAgentDir()` (agent dir: `hotmilk.json`, dedupe) and `CONFIG_DIR_NAME` (project dir: `.pi`, or `.omp` under omp), so every host rule below applies. `HOTMILK_CONFIG_ROOT` overrides the `hotmilk.json` dir for tests/sandboxes.

omp directories (omp resolves them; full list in omp's `environment-variables` doc):

| Variable | Effect on hotmilk under omp |
| -------- | --------------------------- |
| `OMP_PROFILE` (legacy `PI_PROFILE`) | Named profile: agent dir becomes `~/.omp/profiles/<name>/agent`, so each profile has its own `hotmilk.json`. `OMP_PROFILE` wins even when empty |
| `PI_CODING_AGENT_DIR` | Agent dir override for the default profile only; named profiles ignore it |
| `PI_CONFIG_DIR` | Home config root name (default `.omp`); moves the default agent dir to `~/<name>/agent`. The project dir stays `.omp` |
| `XDG_DATA_HOME`, `XDG_STATE_HOME`, `XDG_CACHE_HOME` | Relocate omp data only when the target omp root already exists |

Notifications show the resolved path home-relative (for example `~/.omp/profiles/work/agent/hotmilk.json`).

Pi core (full list in [Pi usage: environment variables](https://pi.dev/docs/latest/usage#environment-variables)):

| Variable                      | Purpose                                                                                                                       |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `PI_CODING_AGENT_DIR`         | Override agent config dir (default `~/.pi/agent`). hotmilk uses this for `hotmilk.json` and global settings dedupe |
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

LLM providers (Pi `auth.json` → env fallback; not hotmilk-specific): common keys include `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `GOOGLE_API_KEY`, `OPENROUTER_API_KEY`, Azure (`AZURE_OPENAI_*`), Vertex (`GOOGLE_CLOUD_*`). See [@earendil-works/pi-ai](https://www.npmjs.com/package/@earendil-works/pi-ai) for the full provider table.

hotmilk-owned:

| Variable              | Purpose                                                                                                                            |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `HOTMILK_CONFIG_ROOT` | Test/sandbox override for the directory that contains `hotmilk.json`. Wins over the host agent dir. Normal installs leave unset |
| `HOTMILK_OMP_UNGATED` | `1`: under omp, load enabled rows even without the `omp` flag. Honored only together with `OMP_AUDIT_TOOLS`, i.e. inside `bun run audit:omp` |

Bundled extensions (only when the matching `/mode` toggle is on):

| Variable                                              | Toggle / package | Purpose                                               |
| ----------------------------------------------------- | ---------------- | ----------------------------------------------------- |
| `GENTLE_PI_AGENTS=0`                                  | `subagents`      | Disable gentle-agents without flipping the toggle     |
| `GENTLE_PI_AGENTS_PI`                                 | `subagents`      | Command used to spawn child agents (default `pi`)     |
| `GEMINI_API_KEY`, `GOOGLE_API_KEY`                    | `graphify` (CLI) | Semantic extraction backend for `graphify extract`    |
| `GRAPHIFY_GEMINI_MODEL`, `GRAPHIFY_WHISPER_MODEL`     | `graphify` (CLI) | Override graphify LLM / Whisper model                 |
| `EXA_API_KEY`, `PERPLEXITY_API_KEY`, `GEMINI_API_KEY` | `web-access`     | Search / fetch keys (`~/.pi/web-search.json` also)    |
| `PI_ALLOW_BROWSER_COOKIES`                            | `web-access`     | `1`: allow Chromium cookie extraction for Gemini Web |
| `CTX_FETCH_STRICT`                                    | `context-mode`   | `1`: stricter fetch routing in context-mode          |

CI / publish (this repo only): GitHub Actions uses secret `NPM_TOKEN`, mapped to `NODE_AUTH_TOKEN` on the publish step. Local `bun publish` uses `~/.npmrc`, not `NPM_TOKEN`.

### pi-btw (side questions)

| Do this                                    | Tool                                                          |
| ------------------------------------------ | ------------------------------------------------------------- |
| Exploration, implementation, review        | subagents (`subagent_*` tools; `/pioneer` for the change flow) |
| Ask a quick question while main is working | `/btw` or `/btw:tangent` (`Alt+/` toggles BTW ↔ main) |
| Same context, structurally read-only tools | `/btw:ask`                                                |
| Bring BTW results back to the main thread  | `/btw:inject`                                             |

The `btw` row loads upstream [pi-btw](https://www.npmjs.com/package/pi-btw) as is. BTW runs a separate Pi session whose tool surface, prompt, and extension sources are pi-btw's: it loads no extensions unless `~/.pi/agent/btw.json` lists them (for example `{"extensions": ["npm:pi-web-access"]}`; see the pi-btw README). hotmilk adds no BTW prompt shaping or proxy tools (retired in 0.2.0: the `createAgentSession` wrap it relied on does not take effect on Pi 1.0).

hotmilk does not bind pi-btw's `Alt+W` width toggle, so Pi's `Alt+W` keybinding stays yours. Set `"btw": false` in `/mode` if you want no side channel.

### Choosing extensions

Every bundled row with its package, `/mode` group, coupling class, omp support, RFC 2119 recommendation level, and combination rules (for example `caveman` vs `defaults.language: ja`, `autoresearch` vs `goal`) lives in [docs/bundles.md](docs/bundles.md). Enable a row in `/mode` or set its key to `true` in `hotmilk.json`, then `/reload`.

### Alternative skill stacks (not bundled)

hotmilk does not bundle [bigpowers](https://github.com/danielvm-git/bigpowers), a separate spec-driven skill stack (70+ skills, prompts, MCP). It has no `pi.extensions` entry, runs `postinstall` global symlinks, and conflicts with the pioneer W-model flow. Install separately if you want that workflow instead of hotmilk's defaults:

```bash
pi install npm:bigpowers
```

Do not run bigpowers and pioneer on the same task.

[latchkey](https://www.npmjs.com/package/latchkey) (API credential injection via `/skill:latchkey`) is also not bundled; install with `pi install npm:latchkey` if needed.

### Cursor models (optional, not bundled)

hotmilk does not ship [@netandreus/pi-cursor-provider](https://www.npmjs.com/package/@netandreus/pi-cursor-provider). Install when you route Pi through the Cursor Agent CLI:

```bash
pi install npm:@netandreus/pi-cursor-provider
agent login
# then in Pi: /model cursor/auto
```

## Development

Requires Node.js and Pi peer versions from `package.json` (`engines`, `peerDependencies`). This repo uses Bun (`bun.lock`).

```bash
bun install       # commit bun.lock; peers resolved by Bun
bun run test      # vp test (same as CI)
bun run lint
bun run format    # vp fmt --write
bun run check     # format check + lint; run bun run test separately
```

`npm install` still works with this repo's `.npmrc` (`legacy-peer-deps=true`). This repo commits `bun.lock` only (no `package-lock.json`); CI uses Bun (`bun install --frozen-lockfile`).

## Contributing

Work starts from a [ROADMAP.md](ROADMAP.md) horizon item and follows the change flow in [docs/maintenance.md](docs/maintenance.md#change-flow): plan with a W table, write the failing test first, then `bun run lint` and `bun run test`, and sync the docs in the same change. [AGENTS.md](AGENTS.md) lists the hard rules (for example: only `src/index.ts` goes in `pi.extensions`). Which doc to open: [docs/guidance.md](docs/guidance.md). Adding a bundled extension: [docs/bundles.md](docs/bundles.md#adding-a-row). Issues and pull requests: [github.com/dayjobdoor/hotmilk](https://github.com/dayjobdoor/hotmilk).

## License

[MIT](LICENSE)
