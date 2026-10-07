# Requirements

What hotmilk ships and how done looks. Structure and startup: [architecture.md](architecture.md). Operator surfaces: [DESIGN.md](../DESIGN.md).

Sources: [README.md](../README.md), [hotmilk.json](../hotmilk.json), [src/config/bundled-extensions.ts](../src/config/bundled-extensions.ts).

## Product

hotmilk is a Pi **meta-package**: one install bundles gentle-pi, context-mode, graphify, subagents, and related extensions, every one default off (0.2.0 minimal core; upgraded configs get a one-time notice naming the rows that were on before) and toggled per bundle in `$PI_CODING_AGENT_DIR/hotmilk.json`.

## In scope

- **Single Pi extension entry**: only `./src/index.ts` in `package.json` → `pi.extensions`; other bundles load when toggled on.
- **Lazy registration**: disabled toggles never import their loader (`src/bootstrap/extensions.ts`).
- **User toggles**: `/mode` edits persona and bundled extension on/off; `/reload` applies extension changes.
- **Config seeding**: missing `hotmilk.json` is created from the bundled template on first session start.
- **Project trust**: `project_trust` handler; modes `delegate`, `prompt`, `always`, `never` (`hotmilk.json` → `projectTrust`).
- **Global dedupe**: skip hotmilk registration when the same npm package is already in Pi settings (trust-safe: global settings only at startup). When a hotmilk repo checkout and a globally installed `npm:hotmilk` both load, the npm-installed copy yields to the project copy (project → user precedence). The yield decision reads only two manifests pre-trust: `cwd/package.json` (`name` + `pi.extensions`) and `cwd/.pi/settings.json` (`packages`/`extensions` source strings, resolved paths only, no execution). The settings read is required: without it a fresh clone (gitignored `.pi/`) would make the global copy yield while no project copy loads, silently removing hotmilk. See [security.md](security.md) for the accepted trade-off.
- **Context stack**: `context-mode` and `rtk-optimizer` load sequentially; with `rtk-optimizer` on, its config is synced once before load and the result is reported at session start.
- **hotmilk-owned TUI**: custom footer, `/mode` modal, `/stop`, `/interrupt`, trust confirm ([DESIGN.md](../DESIGN.md)).
- **omp support**: on the omp release pinned as `OMP_AUDITED_VERSION`, hotmilk loads, registers its commands, and every `omp`-flagged row loads and registers commands or tools; CI enforces it with `bun run audit:omp` ([bundles.md](bundles.md#omp-support)).
- **Harness detection**: pi vs omp from `CONFIG_DIR_NAME` (`src/config/runtime.ts`); under omp, only registry rows flagged `omp: true` load; other enabled toggles are skipped and listed at session start, `/mode` labels them `(pi only)`, and hotmilk commands stay registered.
- **Shipped theme**: [themes/monokai.json](../themes/monokai.json) indexed via `package.json` → `pi.themes`.
- **Package assets**: `skills/`, `prompts/`, `themes/` in the npm tarball.

## Out of scope

- Auditing or sandboxing upstream bundled extension code.
- Bundling alternative skill stacks (bigpowers, latchkey, cursor provider); documented in README only.
- Web-style design tokens (typography, spacing, components); the terminal UI uses Pi theme roles and `monokai.json` only.

## Done looks like

| Area | Acceptance |
| ---- | ---------- |
| New bundled extension | Registry row, `package.json` dependency, README toggle note, module imports with a default factory; checklist in [bundles.md](bundles.md#adding-a-row) |
| Toggle change | Persists to `hotmilk.json`; operator runs `/reload` to apply |
| Startup | Enabled bundles register; context-stack order preserved |
| Trust | Untrusted projects do not load project settings for dedupe; trust prompt when `mode: prompt` and UI exists |
| Tests | `bun run test` and `bun run lint` pass (CI gate) |

Requirement add/remove is human except factual drift sync ([AGENTS.md](../AGENTS.md)).
