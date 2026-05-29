# Pi & hotmilk runtime

Reference for agents editing hotmilk or debugging Pi sessions with hotmilk installed.

## What Pi is here

**Pi** is the local coding-agent CLI/runtime. hotmilk is a **pi-package** (`pi-package` keyword): it ships one extension entry plus bundled npm dependencies, prompts, skills, and themes.

| Concept         | Location                                                                                 |
| --------------- | ---------------------------------------------------------------------------------------- |
| Pi settings     | `~/.pi/agent/settings.json` or project `.pi/settings.json` — `packages: ["npm:hotmilk"]` |
| hotmilk toggles | `~/.pi/agent/hotmilk.json`                                                               |
| Extension API   | `@earendil-works/pi-coding-agent` (`ExtensionAPI`, hooks, commands)                      |

## Startup flow

```text
pi session start
  → loads package.json pi.extensions: [ "./src/index.ts" ]
  → registerHotmilk(pi)
       → createHotmilkRuntime()     # read hotmilk.json once
       → registerBundledExtensions  # parallel dynamic import per enabled toggle
       → registerGraphHandlers / registerDefaultsHandlers / registerSessionHandlers
       → registerInputCommands      # /mode, /stop, /interrupt
```

Disabled toggles **never** call their loader — no import cost.

## Adding or changing a bundled extension

1. Add dependency in `package.json` `dependencies` and `bundleDependencies`.
2. Add id to `BUNDLED_EXTENSION_IDS` in `src/config/hotmilk.ts`.
3. Add default toggle in bundled `hotmilk.json` (runtime derives `DEFAULT_HOTMILK_CONFIG` from it).
4. Add loader in `src/bootstrap/extensions.ts` (`() => import("…/index.ts")`).
5. Add UI group entry in `src/config/extension-groups.ts` (must cover every id).
6. Document toggle in `README.md`.

**Do not** append to `pi.extensions` unless the package must load unconditionally (hotmilk uses only `./src/index.ts`).

## hotmilk-owned commands

| Command      | Writes config              | Needs reload    |
| ------------ | -------------------------- | --------------- |
| `/mode`      | `~/.pi/agent/hotmilk.json` | Yes — `/reload` |
| `/stop`      | —                          | No              |
| `/interrupt` | —                          | No              |

Upstream packages register their own commands (gentle-pi SDD, graphify, context-mode, etc.).

## Pi 0.77 vs dependency peers

hotmilk peers target **0.77**. Some bundled packages still declare **0.74** peer ranges. npm may show `ERESOLVE`; this repo uses `legacy-peer-deps=true` in `.npmrc`. Treat mismatched peers as **best-effort** until upstream widens ranges.

Heavy optional stacks (`agent-dashboard`, `pi-flows`) default **off**.

## graphify integration

When `graphify` is enabled and `graphify-out/GRAPH_REPORT.md` exists in the project cwd, agents should prefer the graph for architecture questions. hotmilk can notify when `graphify-out/needs_update` exists (`graph.warnOnStale`).

## MCP: context-mode vs mcp-adapter

Default (**option A**): `context-mode` extension **on**, `mcp-adapter` **off**, `mcp.seedOnStart` **off**.

| Path                                    | What runs                                                                    |
| --------------------------------------- | ---------------------------------------------------------------------------- |
| context-mode extension                  | Built-in MCP bridge → `ctx_*` Pi tools (one subprocess)                      |
| pi-mcp-adapter + `~/.pi/agent/mcp.json` | Separate MCP client per server entry (duplicate if both define context-mode) |

On session start, when context-mode is on and mcp-adapter is off, hotmilk **removes** a `context-mode` entry from `~/.pi/agent/mcp.json` if present (legacy hotmilk seed).

To use **external MCP servers** via adapter: enable `mcp-adapter`, set `mcp.seedOnStart: true` or edit `mcp.json` manually, and **do not** add a second context-mode server — keep context-mode on the extension bridge only.

## gentle-ai vs subagents

| `gentle-ai` | `subagents` | Effect                                                                                 |
| ----------- | ----------- | -------------------------------------------------------------------------------------- |
| on          | on          | Orchestrator prompts can delegate via pi-subagents tools                               |
| on          | off         | gentle-ai SDD/skills still load; **no** `subagent` tool until you enable and `/reload` |
| off         | on          | Subagent tools without el Gentleman harness prompts                                    |

Default template keeps `gentle-ai: true`, `subagents: false` for faster startup. Enable `subagents` when you want delegation, not just skills in `package.json`.

## Common mistakes

| Mistake                                                       | Why it hurts                                                          |
| ------------------------------------------------------------- | --------------------------------------------------------------------- |
| context-mode extension **and** `mcp.json` context-mode server | Duplicate ctx tools / extra process                                   |
| Listing every package under `pi.extensions`                   | Bypasses toggles; slows every session                                 |
| Forgetting `/reload` after `/mode`                            | UI shows new toggles but old extensions stay loaded                   |
| Sequential `await` in extension registration                  | Slower startup; use parallel registration pattern in `extensions.ts`  |
| Editing only `hotmilk.json` in repo                           | User file is under `~/.pi/agent/`; repo file is the **seed template** |

## Development vs end-user Pi

|         | Repo developer                                     | End user                        |
| ------- | -------------------------------------------------- | ------------------------------- |
| Install | `npm install` + `pi install -l npm:hotmilk`        | `pi install npm:hotmilk`        |
| Config  | Edit `hotmilk.json` template + code in `src/`      | Edit `~/.pi/agent/hotmilk.json` |
| Tests   | `bun test` (no full Pi UI required for unit tests) | Manual session smoke test       |
