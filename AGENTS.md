# hotmilk

Pi meta-package bundling gentle-pi, context-mode, graphify, subagents, and related extensions. User toggles live in `$PI_CODING_AGENT_DIR/hotmilk.json` (default `~/.pi/agent`). User-facing setup: [README.md](README.md).

## Quick reference

- **Package manager:** Bun; commit `bun.lock` only.
- `bun install` — install dependencies.
- `bun run test` — run the test suite (`vp test`).
- `bun run lint` — run lint and type checks (`vp lint`).
- `bun run format` — format files (`vp fmt --write`).
- `bun run check` — format check and lint; run `bun run test` separately.
- Node.js and Pi peer versions must match `package.json` (`engines`, `peerDependencies`).

## Critical contracts

- Pi loads only `./src/index.ts` from `package.json` → `pi.extensions`.
- Toggled bundles load lazily through `BUNDLED_EXTENSION_DEFINITIONS`; do not add them directly to `pi.extensions`.
- Config changes use `/mode`, then `/reload`; tests may set `HOTMILK_CONFIG_ROOT`.
- Project trust and pre-trust global extension deduplication follow [`architecture.md`](docs/architecture.md).
- Keep changes scoped to requested behavior; preserve existing interfaces and load phases.

## Task-specific guidance

- Package layout, startup, bundled extensions, or configuration: [architecture.md](docs/architecture.md)
- Implementation, verification, or documentation changes: [workflow.md](docs/workflow.md)
- Choosing which repository guidance to read: [reference-map.md](docs/reference-map.md)
