# Requirements

What hotmilk ships and how done looks. Structure and startup: [architecture.md](architecture.md). Operator surfaces: [DESIGN.md](../DESIGN.md).

Sources: [README.md](../README.md), [hotmilk.json](../hotmilk.json), [src/config/bundled-extensions.ts](../src/config/bundled-extensions.ts).

## Product

hotmilk is a Pi **meta-package**: one install wires gentle-pi, context-mode, graphify, subagents, and related extensions, with per-bundle toggles in `$PI_CODING_AGENT_DIR/hotmilk.json`.

## In scope

- **Single Pi extension entry**: only `./src/index.ts` in `package.json` → `pi.extensions`; other bundles load when toggled on.
- **Lazy registration**: disabled toggles never import their loader (`src/bootstrap/extensions.ts`).
- **User toggles**: `/mode` edits persona and bundled extension on/off; `/reload` applies extension changes.
- **Config seeding**: missing `hotmilk.json` is created from the bundled template on first session start.
- **Project trust**: `project_trust` handler; modes `delegate`, `prompt`, `always`, `never` (`hotmilk.json` → `projectTrust`).
- **Global dedupe**: skip hotmilk registration when the same npm package is already in Pi settings (trust-safe: global settings only at startup). When a hotmilk repo checkout and a globally installed `npm:hotmilk` both load, the npm-installed copy yields to the project copy (project → user precedence). The yield decision reads only two manifests pre-trust: `cwd/package.json` (`name` + `pi.extensions`) and `cwd/.pi/settings.json` (`packages`/`extensions` source strings, resolved paths only, no execution). The settings read is required: without it a fresh clone (gitignored `.pi/`) would make the global copy yield while no project copy loads, silently removing hotmilk. See [security.md](security.md) for the accepted trade-off.
- **Context stack**: `context-mode` and `rtk-optimizer` load sequentially; RTK config sync and MCP prune when enabled.
- **BTW integration**: when `btw` is on: session hook, prompt shaping, read-biased tools when `subagents` is on, optional `ctx_search` / `graphify_query` proxies.
- **hotmilk-owned TUI**: custom footer, `/mode` modal, `/stop`, `/interrupt`, trust confirm ([DESIGN.md](../DESIGN.md)).
- **Shipped theme**: [themes/monokai.json](../themes/monokai.json) indexed via `package.json` → `pi.themes`.
- **Package assets**: `agents/`, `skills/`, `prompts/`, `themes/` in the npm tarball; copy agents to `.pi/agents/` for discovery.

## Out of scope

- Auditing or sandboxing upstream bundled extension code.
- Bundling alternative skill stacks (bigpowers, latchkey, cursor provider); documented in README only.
- OpenSpec artifacts under `openspec/`: local SDD, gitignored, not published intent.
- Web-style design tokens (typography, spacing, components); the terminal UI uses Pi theme roles and `monokai.json` only.

## Done looks like

| Area | Acceptance |
| ---- | ---------- |
| New bundled extension | Registry row, `package.json` dependency, README toggle note, module resolves on disk |
| Toggle change | Persists to `hotmilk.json`; operator runs `/reload` to apply |
| Startup | Enabled bundles register; context-stack order preserved; BTW hook only when `btw` on |
| Trust | Untrusted projects do not load project settings for dedupe; trust prompt when `mode: prompt` and UI exists |
| Tests | `bun run test` and `bun run lint` pass (CI gate) |

Requirement add/remove is human except factual drift sync ([AGENTS.md](../AGENTS.md)).
