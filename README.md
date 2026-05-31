# hotmilk

**hotmilk** is a Pi meta-package: one install wires gentle-pi, context-mode, graphify, subagents, and related extensions, plus user toggles in `~/.pi/agent/hotmilk.json`.

Use it when you want a practical engineering workstation without hand-picking a dozen `pi-*` packages and wiring `settings.json` yourself.

## What you get

| Layer                   | Packages / assets                                                                                                                                                                                                       |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Orchestration**       | [gentle-pi](https://www.npmjs.com/package/gentle-pi) (SDD, skill registry, `sdd-init`)                                                                                                                                  |
| **Context**             | [context-mode](https://www.npmjs.com/package/context-mode)                                                                                                                                                              |
| **Codebase graph**      | [graphify-pi](https://www.npmjs.com/package/graphify-pi)                                                                                                                                                                |
| **Subagents**           | [pi-subagents](https://www.npmjs.com/package/pi-subagents), [pi-ask-user](https://www.npmjs.com/package/pi-ask-user)                                                                                                    |
| **Goals & docs**        | [pi-goal](https://www.npmjs.com/package/pi-goal), [pi-docparser](https://www.npmjs.com/package/pi-docparser)                                                                                                            |
| **File-based planning** | [@tomxprime/planning-with-files](https://www.npmjs.com/package/@tomxprime/planning-with-files)                                                                                                                          |
| **Integrations**        | [pi-mcp-adapter](https://www.npmjs.com/package/pi-mcp-adapter), [pi-btw](https://www.npmjs.com/package/pi-btw) (side channel — see below), [@haispeed/pi-obsidian](https://www.npmjs.com/package/@haispeed/pi-obsidian) |
| **Dashboard**           | [@blackbelt-technology/pi-agent-dashboard](https://www.npmjs.com/package/@blackbelt-technology/pi-agent-dashboard)                                                                                                      |
| **Web tools**           | [pi-web-access](https://www.npmjs.com/package/pi-web-access)                                                                                                                                                            |
| **Flows**               | [@blackbelt-technology/pi-flows](https://www.npmjs.com/package/@blackbelt-technology/pi-flows)                                                                                                                          |
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

### Pi 0.78 and npm peers

hotmilk targets **Pi 0.78** (`@earendil-works/pi-coding-agent` and peers). Several bundled dependencies still declare **0.74.x** peer ranges (`pi-simplify`, `pi-btw`, `pi-docparser`, `@blackbelt-technology/pi-flows`, and others). npm may report `ERESOLVE` until those packages publish 0.78-compatible peers.

This repo ships **`.npmrc`** with `legacy-peer-deps=true` so `npm install` and `npm ci` succeed. Copy from `.npmrc.example` if you clone without `.npmrc`. Treat upstream extensions as **best-effort on 0.78** until their maintainers widen peer ranges.

Heavy optional stacks (`agent-dashboard`, `pi-flows`) stay **off by default**; enable in `/mode` only when you need them and accept extra peer / startup cost.

### Commands (hotmilk)

| Command                | Purpose                                                      |
| ---------------------- | ------------------------------------------------------------ |
| `/mode`                | Toggle bundled extensions; writes `~/.pi/agent/hotmilk.json` |
| `/stop`                | Stop current running work                                    |
| `/interrupt <message>` | Steer in-flight work with an interrupt prompt                |

Upstream packages add their own commands (gentle-pi SDD, graphify, context-mode, planning-with-files `/plan-status`, and so on).

### Planning with files

Invoke when you want Manus-style on-disk planning:

```text
/skill:planning-with-files
```

Or ask Pi to use the planning-with-files skill. The extension maintains `task_plan.md`, `findings.md`, and `progress.md`. Optional: `PWF_MODE=cache-safe` or `planningWithFiles.mode` in settings (see upstream README).

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
    "caveman": false,
    "red-green": false,
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
  }
}
```

| Key / area                        | Behavior                                                                                                                                                                                               |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `extensions.*`                    | Set to `false` to skip registering that bundled extension                                                                                                                                              |
| `extensions.subagents`            | Default `true`. Imports pi-subagents (~10s). Use with `gentle-ai` for delegation; set `false` for faster startup without Task tools                                                                    |
| `extensions.btw`                  | Default `true`. Side conversation via `/btw` while main runs. **Delegate implementation to subagents**; use BTW for quick human questions. See [pi-btw coexistence](#pi-btw-with-subagents-default-on) |
| `extensions.context-mode`         | Default `true`. Prefer `ctx_*` for large outputs (see project context-window rules)                                                                                                                    |
| `extensions.rtk-optimizer`        | Default `false`. Bash/read/grep output compaction; enable with `context-mode` for leftover shell output. Install [`rtk` CLI](https://github.com/rtk-ai/rtk) for command rewrite (`/rtk verify`)        |
| `extensions.goal` … `mcp-adapter` | Integration / perf extensions (formerly always loaded via `pi.extensions`; now toggled like other bundled deps)                                                                                        |
| Enabled extensions                | Loaded **in parallel** on session start (faster than sequential import when many toggles are on)                                                                                                       |
| `graph.warnOnStale`               | Notify when `graphify-out/needs_update` exists                                                                                                                                                         |
| `graph.autoSuggestUpdate`         | Append `graphify update .` to that notification                                                                                                                                                        |
| `defaults.persona`                | Seeds `.pi/gentle-ai/persona.json` when missing (`gentleman` \| `neutral`)                                                                                                                             |
| `defaults.language`               | Appends a project language hint to the system prompt each turn                                                                                                                                         |
| `mcp.seedOnStart`                 | Copy `mcp.json` template into `~/.pi/agent/mcp.json` when missing (empty template; for pi-mcp-adapter)                                                                                                 |
| `extensions.mcp-adapter`          | Default `false`. Enable only when you want MCP servers from `~/.pi/agent/mcp.json` (do not duplicate context-mode)                                                                                     |

**MCP (default):** `context-mode` extension registers `ctx_*` via its built-in bridge (same module as [upstream `.pi/extensions/context-mode`](https://github.com/mksglu/context-mode/tree/main/.pi/extensions/context-mode), loaded from `build/adapters/pi/extension.js`). Hotmilk removes any `context-mode` server from `~/.pi/agent/mcp.json` when the extension is on. Enable `mcp-adapter` only for **other** MCP servers—not a second context-mode entry.

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

| Toggle            | Package                                                                                                            | Notes                                                                                                                          |
| ----------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `caveman`         | [pi-caveman](https://www.npmjs.com/package/pi-caveman)                                                             | Terse English (`/caveman`). Conflicts with `defaults.language: ja`                                                             |
| `red-green`       | [pi-red-green](https://www.npmjs.com/package/pi-red-green)                                                         | TDD via `/tdd`, `/tdd-status`. Config: `~/.pi/red-green/config.json`                                                           |
| `agent-dashboard` | [@blackbelt-technology/pi-agent-dashboard](https://www.npmjs.com/package/@blackbelt-technology/pi-agent-dashboard) | Warm-starts before the bridge loads (cold boot up to ~60s). Peers **0.74**; test on 0.78 before relying on it. Node.js ≥ 22.18 |
| `web-access`      | [pi-web-access](https://www.npmjs.com/package/pi-web-access)                                                       | `web_search`, fetch, GitHub clone, PDF/video. Optional keys: `~/.pi/web-search.json`                                           |
| `pi-flows`        | [@blackbelt-technology/pi-flows](https://www.npmjs.com/package/@blackbelt-technology/pi-flows)                     | YAML DAG workflows (`/flows`). Peers **0.74** + `@sinclair/typebox`; off by default on 0.78 stacks                             |
| `kanagawa`        | [pi-kanagawa](https://www.npmjs.com/package/pi-kanagawa)                                                           | Kanagawa theme (also in `/theme` via shipped assets), wave animation, `/thinking`. **Replaces hotmilk footer** when on         |
| `tetris`          | [pi-tetris](https://www.npmjs.com/package/pi-tetris)                                                               | Play Tetris with `/tetris`. Lightweight; default off                                                                           |

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

### Migrating from `pi-ninja`

The npm package was renamed from **pi-ninja** to **hotmilk**. User config lives at **`~/.pi/agent/hotmilk.json`**.

| Before                    | After                                  |
| ------------------------- | -------------------------------------- |
| `pi install npm:pi-ninja` | `pi install npm:hotmilk`               |
| Project `pi-ninja.json`   | `~/.pi/agent/hotmilk.json` via `/mode` |

Update `settings.json` packages from `npm:pi-ninja` to `npm:hotmilk`, then `/reload`.

Older **tabako** users: replace `npm:tabako` with `npm:hotmilk`; let hotmilk seed `hotmilk.json` on first session.

## Development

Requires **Node.js 22+** (or **Bun 1.3+**), **Bun** for installs in this repo, and Pi **0.78** peers in the environment.

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

| Path                             | Role                                                                   |
| -------------------------------- | ---------------------------------------------------------------------- |
| `src/index.ts`                   | Extension entry: config, bundled extensions, session UI, input routing |
| `src/config/hotmilk.ts`          | `hotmilk.json` load / seed / save                                      |
| `prompts/`, `skills/`, `themes/` | Shipped with the package (`pi.prompts`, `pi.skills`, `pi.themes`)      |
| `mcp.json`                       | MCP server template for local projects                                 |
| `hotmilk.json`                   | Default toggle template (published in the npm package)                 |

## License

[MIT](LICENSE) — Copyright (c) 2026 dayjobdoor. Bundled dependencies keep their own licenses (for example [gentle-pi](https://www.npmjs.com/package/gentle-pi) is MIT).

## Contributing

Issues and PRs are welcome. When you add an extension, skill, or workflow, document how to enable it (toggle key, settings path, or command) in this README.
