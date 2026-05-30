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

## gentle-pi vs hotmilk branding

| gentle-pi upstream                                    | hotmilk                                    |
| ----------------------------------------------------- | ------------------------------------------ |
| `extensions/startup-banner.ts` (animated GENTLE logo) | **Not loaded** — use hotmilk figlet banner |
| `extensions/gentle-ai.ts`                             | Toggle `gentle-ai` (default ON)            |
| `extensions/skill-registry.ts`                        | Toggle `skill-registry` (default ON)       |
| `extensions/sdd-init.ts`                              | Toggle `sdd-init` (default OFF)            |

Session start shows **`hotmilk` ASCII in the header** via `ctx.ui.setHeader` (accent color, **stays until session ends**). Same `setHeader` hook as gentle-pi `startup-banner` after its animation finishes, but **static** (no 25ms render loop — avoids interrupting chat). Shown on every `session_start` except **`reload`**. Cleared on `session_shutdown` only. gentle-pi `startup-banner` is not loaded.

## Adding or changing a bundled extension

1. Add dependency in `package.json` `dependencies` (do not add `bundleDependencies` — npm rejects hard-linked bundled tarballs with `E415`).
2. Add **one row** to `BUNDLED_EXTENSION_DEFINITIONS` in `src/config/bundled-extensions.ts` (`id`, `package`, `module`, `group`, optional `loadPhase: "context-stack"`).
3. Add default toggle in bundled `hotmilk.json` (runtime derives `DEFAULT_HOTMILK_CONFIG` from it).
4. Document toggle in `README.md`.

Derived automatically from the manifest (do not edit separately):

- `BUNDLED_EXTENSION_IDS`, `/mode` groups, global-install dedupe package map, dynamic import loaders.

New `/mode` section? Add its label to `BUNDLED_EXTENSION_GROUP_ORDER` in the same file.

**Do not** append to `pi.extensions` unless the package must load unconditionally (hotmilk uses only `./src/index.ts`).

## hotmilk-owned commands

| Command      | Writes config              | Needs reload    |
| ------------ | -------------------------- | --------------- |
| `/mode`      | `~/.pi/agent/hotmilk.json` | Yes — `/reload` |
| `/stop`      | —                          | No              |
| `/interrupt` | —                          | No              |

Upstream packages register their own commands (gentle-pi SDD, graphify, context-mode, etc.).

## Pi 0.78 vs dependency peers

hotmilk peers target **0.78**. Some bundled packages still declare **0.74** peer ranges. npm may show `ERESOLVE`; this repo uses `legacy-peer-deps=true` in `.npmrc`. Treat mismatched peers as **best-effort** until upstream widens ranges.

Heavy optional stacks (`agent-dashboard`, `pi-flows`) default **off**.

## graphify integration

When `graphify` is enabled and `graphify-out/GRAPH_REPORT.md` exists in the project cwd, agents should prefer the graph for architecture questions. hotmilk can notify when `graphify-out/needs_update` exists (`graph.warnOnStale`).

## MCP: context-mode vs mcp-adapter

Default (**option A**): `context-mode` extension **on**, `mcp-adapter` **off**, `mcp.seedOnStart` **off**.

| Path                                    | What runs                                                                                                       |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| context-mode extension                  | Built-in MCP bridge → `ctx_*` (npm `build/adapters/pi/extension.js`; upstream `.pi/extensions/` is a re-export) |
| pi-mcp-adapter + `~/.pi/agent/mcp.json` | Separate MCP client per server entry (duplicate if both define context-mode)                                    |

On session start, when the context-mode extension is on, hotmilk **removes** a `context-mode` entry from `~/.pi/agent/mcp.json` if present (legacy seed or upstream docs). The extension bridge (`ctx_*`) is the single context-mode path; mcp.json should list only **other** MCP servers when using `mcp-adapter`.

To use **external MCP servers** via adapter: enable `mcp-adapter`, set `mcp.seedOnStart: true` or edit `mcp.json` manually, and **do not** add a second context-mode server — keep context-mode on the extension bridge only.

## gentle-ai vs subagents

| `gentle-ai` | `subagents` | Effect                                                                                 |
| ----------- | ----------- | -------------------------------------------------------------------------------------- |
| on          | on          | Orchestrator prompts can delegate via pi-subagents tools                               |
| on          | off         | gentle-ai SDD/skills still load; **no** `subagent` tool until you enable and `/reload` |
| off         | on          | Subagent tools without el Gentleman harness prompts                                    |

Default template keeps `gentle-ai: true`, `subagents: false` for faster startup. Enable `subagents` when you want delegation, not just skills in `package.json`.

## Global vs bundled extension dedupe

When `npm:hotmilk` is active **and** Pi settings also list a bundled package (e.g. `npm:graphify-pi` or a local path to `graphify-pi`), hotmilk **skips** the bundled dynamic import for that toggle and lets the global Pi extension register instead. Detection reads `packages` and `extensions` from both `~/.pi/agent/settings.json` and project `.pi/settings.json`.

| Automatic dedupe today                      | Mechanism                                                              |
| ------------------------------------------- | ---------------------------------------------------------------------- |
| context-mode MCP server in `mcp.json`       | Pruned on session start when extension bridge is on                    |
| agent-dashboard local bridge path           | Pruned from `packages[]` on warm-start when hotmilk bundles dashboard  |
| Any bundled npm package also in Pi settings | Bundled import skipped; session notifies which ids used global install |

Package names for dedupe are declared on each `BUNDLED_EXTENSION_DEFINITIONS` row (`package` field). Do not maintain a separate registry file.

## context-mode vs pi-rtk-optimizer

| Layer              | `context-mode` (default on)     | `rtk-optimizer` (default off)                       |
| ------------------ | ------------------------------- | --------------------------------------------------- |
| Strategy           | Keep raw bytes out of the model | Compact tool output that still enters the session   |
| Tools              | `ctx_*`, indexing, sandbox      | Hooks on `bash` / `read` / `grep` results           |
| Bash rewrite       | —                               | Optional `rtk` CLI rewrite (`rewrite` or `suggest`) |
| hotmilk load order | Registers **before** rtk        | After context-mode when both enabled                |

**Recommended:** leave `context-mode` on; turn `rtk-optimizer` on when you still run heavy `bash`/`grep` and want smaller transcripts. Install the [`rtk`](https://github.com/rtk-ai/rtk) binary for rewrite mode (`/rtk verify`).

On first enable, hotmilk seeds `~/.pi/agent/extensions/pi-rtk-optimizer/config.json` only if missing:

- With `context-mode` on: `mode: "suggest"`, output compaction on, `readCompaction` off
- With `context-mode` off: `mode: "rewrite"` (needs `rtk` on PATH for rewrite)

On every session (and before rtk loads), hotmilk **syncs** only `mode` and `readCompaction.enabled` when context-mode is on — so stale `rewrite` configs from an earlier setup do not fight ctx routing. **Pi auto-compaction** (`settings.json` → `compaction.enabled`) is never modified by hotmilk.

| Priority | Layer           | Role                                        |
| -------- | --------------- | ------------------------------------------- |
| 1        | Pi auto-compact | Summarize history when context window fills |
| 2        | context-mode    | Keep raw tool bytes out via `ctx_*`         |
| 3        | rtk-optimizer   | Compact bash/read/grep still in the session |

Tune via `/rtk` in the session. Do not enable aggressive `readCompaction` unless you accept edit-anchor risk (see upstream README).

## Common mistakes

| Mistake                                                               | Why it hurts                                                                        |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| context-mode extension **and** `mcp.json` context-mode server         | Duplicate ctx tools / extra process                                                 |
| `context-mode` + `rtk-optimizer` both on without `rtk` CLI            | Compaction still works; bash rewrite stays bypassed (`guardWhenRtkMissing`)         |
| Listing every package under `pi.extensions`                           | Bypasses toggles; slows every session                                               |
| Same bundled npm package in `settings.json` **and** hotmilk toggle on | Usually OK — hotmilk skips bundled import when Pi settings already list the package |
| Forgetting `/reload` after `/mode`                                    | UI shows new toggles but old extensions stay loaded                                 |
| Sequential `await` in extension registration                          | Slower startup; use parallel registration pattern in `extensions.ts`                |
| Editing only `hotmilk.json` in repo                                   | User file is under `~/.pi/agent/`; repo file is the **seed template**               |

## Development vs end-user Pi

|         | Repo developer                                     | End user                        |
| ------- | -------------------------------------------------- | ------------------------------- |
| Install | `npm install` + `pi install -l npm:hotmilk`        | `pi install npm:hotmilk`        |
| Config  | Edit `hotmilk.json` template + code in `src/`      | Edit `~/.pi/agent/hotmilk.json` |
| Tests   | `bun test` (no full Pi UI required for unit tests) | Manual session smoke test       |
