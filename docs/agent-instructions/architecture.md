# Architecture Guidelines

Applies when changing package layout, startup, bundled extensions, or configuration.

## Package model

- hotmilk is a Pi meta-package. It bundles gentle-pi, context-mode, graphify, subagents, and related extensions.
- Pi loads only `./src/index.ts` from `package.json` → `pi.extensions`.
- Toggled bundles load lazily through `BUNDLED_EXTENSION_DEFINITIONS` and `src/bootstrap/extensions.ts`; do not add toggled packages directly to `pi.extensions`.
- Adding a bundle requires one registry row, a `hotmilk.json` default, a `package.json` dependency, and README documentation.
- Keep the registry's normal package module path. Preserve an explicit pre-load hook only when an upstream package requires hotmilk integration before import, as with `pi-btw`.

## Configuration and trust

- User config: `$PI_CODING_AGENT_DIR/hotmilk.json` (default `~/.pi/agent`); tests may set `HOTMILK_CONFIG_ROOT`.
- `/mode` edits persona and toggles; `/reload` applies them.
- `projectTrust` is handled by `src/bootstrap/project-trust.ts`.
- Before trust, startup deduplication scans global Pi settings only (`includeProjectSettings: false` in `src/index.ts`).
- `.agents/`, `graphify-out/`, and `openspec/` are gitignored runtime data, not package sources.

## Layout

- `src/index.ts`: extension entry and startup registration.
- `src/config/`: config I/O, runtime resolution, and bundled registry.
- `src/bootstrap/`: registration, context/session handling, graph, defaults, BTW, trust, and `/subagents-doctor`.
- `src/controller/`: `/mode`, `/stop`, and `/interrupt`.
- `skills/`: first-party skills discovered through `pi.skills`.
- `docs/`: architecture and workflow documentation.

Use `docs/design.md` for startup/load order and `docs/directory.md` for the full tree.

## Recon

- graphify is on by default; shazam is off by default.
- Prefer graphify for architecture and relationship questions. Refresh it with `graphify update .` after code changes before relying on graph output.
