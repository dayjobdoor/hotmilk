# Security

Threats, secrets, and permissions. Deploy and release in [maintenance.md](maintenance.md); structure in [architecture.md](architecture.md).

Sources: [src/bootstrap/project-trust.ts](../src/bootstrap/project-trust.ts), [src/bootstrap/global-extension-sources.ts](../src/bootstrap/global-extension-sources.ts), [src/bootstrap/btw.ts](../src/bootstrap/btw.ts), [src/config/mcp.ts](../src/config/mcp.ts), [src/index.ts](../src/index.ts), [.github/workflows/publish.yml](../.github/workflows/publish.yml).

## Threats

| Threat                                                                                                       | Control                                                                                                                                                                                                                                                                  |
| ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Third-party npm surface (bundled extensions run with full agent capability; hotmilk does not audit upstream) | Default-off toggles for higher-risk bundles; `/mode` review; keep deps updated; README trade-offs                                                                                                                                                                        |
| Project-local resources (`.pi/settings.json`, `.pi/agents/`, `.agents/skills`)                               | Pi project trust. hotmilk registers a `project_trust` handler: `delegate` (default) defers to Pi; `prompt` shows the project cwd and what trust enables; `always` / `never` with `remember` writes Pi `trust.json`                                                       |
| Reading project settings before trust                                                                        | Startup dedupe scans global settings only (`includeProjectSettings: false` in `src/index.ts`); project settings are scanned only when `ctx.isProjectTrusted()`. Sole exception: the two-copy yield probe (next row)                                                                                                                       |
| npm-installed copy reading project state before trust                                                        | The two-copy yield probe (`detectProjectHotmilkEntry`) reads only `cwd/package.json` (`name`, `pi.extensions`) and `cwd/.pi/settings.json` (`packages`/`extensions` source strings, resolved to the copy's load targets). No code execution. A repo can suppress the global copy's registration by naming itself hotmilk; capability-reducing only, and Pi's trust prompt still gates the project's own extension. Without the settings check, a fresh clone would silently lose hotmilk entirely |
| Same extension loaded twice (user-installed package + hotmilk registry)                                      | `detectGlobalBundledExtensionSkips` skips the hotmilk copy when Pi settings already provide the package; when a repo checkout and a global `npm:hotmilk` both load, the npm-installed copy yields to the project copy (`shouldYieldToProjectEntry`)                                                                                                                                                                                                                                                                                        |
| BTW side sessions escaping isolation                                                                         | BTW sessions load **no** bundled extensions (context-mode MCP fork-bomb, upstream #516); when `subagents` is on, BTW tools are read-biased (`read`, `grep`, `find`, `ls`, `bash`); no `edit`/`write`; main-session harness sections are stripped from inherited prompts |
| BTW mutating the knowledge base                                                                              | `ctx_search` is a read-only proxy; `ctx_execute`, `ctx_batch_execute`, `ctx_purge` are excluded from BTW                                                                                                                                                                 |
| Duplicate MCP servers                                                                                        | context-mode registers `ctx_*` through its own bridge; hotmilk prunes the duplicate `context-mode` server from `$PI_CODING_AGENT_DIR/mcp.json` (`src/config/mcp.ts`); `codemcp` is default on and both reads and writes `mcp.json` (`/codemcp` server toggles persist there); `mcp-adapter` is default off. Keep non-context-mode servers only                             |
| `graphify_query` shell-out                                                                                   | Fixed argv (no user interpolation into the command name), 120 s timeout, 512 KB `maxBuffer`, graph path pinned to `graphify-out/graph.json`                                                                                                                              |

## Secrets

- CI publish uses the GitHub secret `NPM_TOKEN`, mapped to `NODE_AUTH_TOKEN` by `setup-node`. It is never committed.
- Local publish tokens live in `~/.npmrc`; the repo `.npmrc` contains only `legacy-peer-deps=true`.
- Bundled-extension API keys (`GEMINI_API_KEY`, `EXA_API_KEY`, …) are environment-provided; `.env` is gitignored.
- The shipped `hotmilk.json` template holds only graph, defaults, and trust settings; no credentials.

## Permissions (what hotmilk writes)

- `$PI_CODING_AGENT_DIR/hotmilk.json` (seeded on first session start, then `/mode`)
- `$PI_CODING_AGENT_DIR/extensions/pi-autoresearch.json` and `pi-rtk-optimizer/config.json` (seeded config)
- `$PI_CODING_AGENT_DIR/mcp.json` (context-mode prune only)
- Project `.pi/gentle-ai/persona.json` (only after project trust, when `gentle-ai` is on)

`openspec/`, `odd/`, `graphify-out/`, and `.agents/` are local gitignored runtime data, not package sources.
