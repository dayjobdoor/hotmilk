# hotmilk

User-facing setup: [README.md](README.md). UI: [DESIGN.md](DESIGN.md). Intent: `docs/`. Runtime: code, CI, `package.json`. Conflict → code.

## Bans

- Pi loads only `./src/index.ts` from `package.json` → `pi.extensions`.
- Do not add toggled bundles to `pi.extensions`.
- Config: `/mode`, then `/reload`. Tests may set `HOTMILK_CONFIG_ROOT`.
- `openspec/` is local gitignored SDD, not published intent. Canonical intent is `docs/`.
- Requirement add/remove is human except factual drift sync.

## Read next

- What ships: [docs/requirements.md](docs/requirements.md)
- Roadmap horizons: [ROADMAP.md](ROADMAP.md)
- Package layout, startup, load order, config: [docs/architecture.md](docs/architecture.md)
- TUI behavior and theme: [DESIGN.md](DESIGN.md), [themes/monokai.json](themes/monokai.json)
- Tests and verification: [docs/testing.md](docs/testing.md)
- Which file to open: [docs/guidance.md](docs/guidance.md)
