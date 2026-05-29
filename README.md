# hotmilk

**hotmilk** is a Pi meta-package: one install wires gentle-pi, context-mode, graphify, subagents, and related extensions, plus user toggles in `~/.pi/agent/hotmilk.json`.

Use it when you want a practical engineering workstation without hand-picking a dozen `pi-*` packages and wiring `settings.json` yourself.

## What you get

| Layer                   | Packages / assets                                                                                                                                                                                                                                                                            |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Orchestration**       | [gentle-pi](https://www.npmjs.com/package/gentle-pi) (SDD, skill registry, `sdd-init`)                                                                                                                                                                                                       |
| **Context**             | [context-mode](https://www.npmjs.com/package/context-mode)                                                                                                                                                                                                                                   |
| **Codebase graph**      | [graphify-pi](https://www.npmjs.com/package/graphify-pi)                                                                                                                                                                                                                                     |
| **Subagents**           | [pi-subagents](https://www.npmjs.com/package/pi-subagents), [pi-ask-user](https://www.npmjs.com/package/pi-ask-user)                                                                                                                                                                         |
| **Goals & docs**        | [pi-goal](https://www.npmjs.com/package/pi-goal), [pi-docparser](https://www.npmjs.com/package/pi-docparser)                                                                                                                                                                                 |
| **File-based planning** | [@tomxprime/planning-with-files](https://www.npmjs.com/package/@tomxprime/planning-with-files)                                                                                                                                                                                               |
| **Integrations**        | [pi-mcp-adapter](https://www.npmjs.com/package/pi-mcp-adapter), [pi-btw](https://www.npmjs.com/package/pi-btw), [@haispeed/pi-obsidian](https://www.npmjs.com/package/@haispeed/pi-obsidian), [@netandreus/pi-cursor-provider](https://www.npmjs.com/package/@netandreus/pi-cursor-provider) |
| **Dashboard**           | [@blackbelt-technology/pi-agent-dashboard](https://www.npmjs.com/package/@blackbelt-technology/pi-agent-dashboard)                                                                                                                                                                           |
| **Web tools**           | [pi-web-access](https://www.npmjs.com/package/pi-web-access)                                                                                                                                                                                                                                 |
| **Flows**               | [@blackbelt-technology/pi-flows](https://www.npmjs.com/package/@blackbelt-technology/pi-flows)                                                                                                                                                                                               |
| **Local assets**        | `./prompts`, `./skills`, `./themes`, `mcp.json` template                                                                                                                                                                                                                                     |

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

### Pi 0.77 and npm peers

hotmilk targets **Pi 0.77** (`@earendil-works/pi-coding-agent` and peers). Several bundled dependencies still declare **0.74.x** peer ranges (`pi-simplify`, `pi-btw`, `pi-docparser`, `@blackbelt-technology/pi-flows`, and others). npm may report `ERESOLVE` until those packages publish 0.77-compatible peers.

This repo ships **`.npmrc`** with `legacy-peer-deps=true` so `npm install` and `npm ci` succeed. Copy from `.npmrc.example` if you clone without `.npmrc`. Treat upstream extensions as **best-effort on 0.77** until their maintainers widen peer ranges.

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
    "subagents": false,
    "goal": true,
    "docparser": true,
    "obsidian": true,
    "cursor-provider": true,
    "btw": true,
    "simplify": true,
    "rtk-optimizer": true,
    "mcp-adapter": false,
    "planning-with-files": false,
    "caveman": false,
    "red-green": false,
    "agent-dashboard": false,
    "web-access": false,
    "pi-flows": false
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

| Key / area                        | Behavior                                                                                                           |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `extensions.*`                    | Set to `false` to skip registering that bundled extension                                                          |
| `extensions.subagents`            | Default `false`. When `true`, imports pi-subagents (~10s). Use with `gentle-ai` for delegation                     |
| `extensions.goal` … `mcp-adapter` | Integration / perf extensions (formerly always loaded via `pi.extensions`; now toggled like other bundled deps)    |
| Enabled extensions                | Loaded **in parallel** on session start (faster than sequential import when many toggles are on)                   |
| `graph.warnOnStale`               | Notify when `graphify-out/needs_update` exists                                                                     |
| `graph.autoSuggestUpdate`         | Append `graphify update .` to that notification                                                                    |
| `defaults.persona`                | Seeds `.pi/gentle-ai/persona.json` when missing (`gentleman` \| `neutral`)                                         |
| `defaults.language`               | Appends a project language hint to the system prompt each turn                                                     |
| `mcp.seedOnStart`                 | Copy `mcp.json` template into `~/.pi/agent/mcp.json` when missing (empty template; for pi-mcp-adapter)             |
| `extensions.mcp-adapter`          | Default `false`. Enable only when you want MCP servers from `~/.pi/agent/mcp.json` (do not duplicate context-mode) |

**MCP (default):** `context-mode` extension registers `ctx_*` tools via its built-in bridge. Do **not** run `context-mode` as an MCP server at the same time. Hotmilk removes a legacy `context-mode` entry from `~/.pi/agent/mcp.json` on session start when the extension is on and mcp-adapter is off.

### Optional extensions (off by default)

Enable in `/mode` or set the key to `true` in `hotmilk.json`, then `/reload`.

| Toggle            | Package                                                                                                            | Notes                                                                                                           |
| ----------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| `caveman`         | [pi-caveman](https://www.npmjs.com/package/pi-caveman)                                                             | Terse English (`/caveman`). Conflicts with `defaults.language: ja`                                              |
| `red-green`       | [pi-red-green](https://www.npmjs.com/package/pi-red-green)                                                         | TDD via `/tdd`, `/tdd-status`. Config: `~/.pi/red-green/config.json`                                            |
| `agent-dashboard` | [@blackbelt-technology/pi-agent-dashboard](https://www.npmjs.com/package/@blackbelt-technology/pi-agent-dashboard) | Warm-starts via `pi-dashboard start` (~30s). Peers **0.74**; test on 0.77 before relying on it. Node.js ≥ 22.18 |
| `web-access`      | [pi-web-access](https://www.npmjs.com/package/pi-web-access)                                                       | `web_search`, fetch, GitHub clone, PDF/video. Optional keys: `~/.pi/web-search.json`                            |
| `pi-flows`        | [@blackbelt-technology/pi-flows](https://www.npmjs.com/package/@blackbelt-technology/pi-flows)                     | YAML DAG workflows (`/flows`). Peers **0.74** + `@sinclair/typebox`; off by default on 0.77 stacks              |

**Agent dashboard troubleshooting**

- Run **one** dashboard process: either hotmilk warm-start (`agent-dashboard: true`) **or** manual `npm run dashboard:start`, not both.
- Keep only `"hotmilk"` in `~/.pi/agent/settings.json` `packages[]` (not a standalone dashboard extension path). Hotmilk prunes duplicate dashboard paths on session start when `agent-dashboard` is enabled.
- `EADDRINUSE` on `8000` or `9999`: `npm run dashboard:stop`, then `lsof -i :8000` / `:9999` and kill the stale PID before starting again.
- Without `zrok` on PATH, hotmilk sets `tunnel.enabled` to `false`.

### Migrating from `pi-ninja`

The npm package was renamed from **pi-ninja** to **hotmilk**. User config lives at **`~/.pi/agent/hotmilk.json`**.

| Before                    | After                                  |
| ------------------------- | -------------------------------------- |
| `pi install npm:pi-ninja` | `pi install npm:hotmilk`               |
| Project `pi-ninja.json`   | `~/.pi/agent/hotmilk.json` via `/mode` |

Update `settings.json` packages from `npm:pi-ninja` to `npm:hotmilk`, then `/reload`.

Older **tabako** users: replace `npm:tabako` with `npm:hotmilk`; let hotmilk seed `hotmilk.json` on first session.

## Development

Requires **Node.js 22+** (or **Bun 1.3+**), **Bun** for installs in this repo, and Pi **0.77** peers in the environment.

```bash
bun install       # commit bun.lock; peers resolved by Bun
bun test          # vitest via vite-plus
bun run lint
bun run check     # lint + format + test
```

`npm install` still works if you use `.npmrc` (`legacy-peer-deps=true`) and `package-lock.json`; CI uses **Bun** only.

### CI and release

On push to `main`, GitHub Actions runs **lint + test** (`bun install --frozen-lockfile`), then a separate job pushes tag `v<package.json version>` only when that tag is not already the latest GitHub release. Pushing the tag triggers **`publish.yml`**, which runs `npm publish --provenance` via **npm Trusted Publishing** (GitHub OIDC — no `NPM_TOKEN` in CI). Bump `version` in `package.json` before expecting a new release.

**npm Trusted Publisher** (one-time, [package settings](https://www.npmjs.com/package/hotmilk/access)):

| Field | Value |
|-------|--------|
| Provider | GitHub Actions |
| Repository | `dayjobdoor/hotmilk` |
| Workflow file | **`publish.yml`** (filename only, not the display name) |
| Environment | *(leave empty unless the workflow uses `environment:`)* |
| Allowed actions | **`npm publish`** |

Do **not** run **Publish Package** manually from the Actions tab (`workflow_dispatch`). Tag push only — manual runs often sign provenance then fail with **`404 PUT … hotmilk`**.

If CI logs show **provenance OK** but **`404 PUT … hotmilk`**, check: (1) the run was triggered by a **`v*`** tag push, not a manual dispatch; (2) the Trusted Publisher table above; (3) you configured Trusted Publisher while logged in as the npm user that owns `hotmilk`.

**Do not use `npm whoami` in CI for Trusted Publishing.** npm docs state that `whoami` does not reflect OIDC auth (401 is expected); authentication applies only during `npm publish` / `npm stage publish`.

**GitHub secrets:** delete **`NPM_TOKEN`** and any **`NODE_AUTH_TOKEN`** you added for npm (repository, organization, and environment secrets). `actions/setup-node` with `registry-url: https://registry.npmjs.org` automatically maps `NPM_TOKEN` → `NODE_AUTH_TOKEN`; that overrides OIDC. A masked `NODE_AUTH_TOKEN` in logs without any secret is normal — it is the short-lived OIDC token from `setup-node`. Keep only the automatic `GITHUB_TOKEN` (checkout/API). Do not set `NODE_AUTH_TOKEN` to `GITHUB_TOKEN` — it is not valid for registry.npmjs.org.

Local `bun publish` / `npm publish` still needs `npm login` or a token; Trusted Publishing applies to CI only.

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
