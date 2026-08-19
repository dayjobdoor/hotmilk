# hotmilk

Pi **meta-package**: one install bundles gentle-pi, context-mode, graphify, subagents, and related extensions. User toggles live in `$PI_CODING_AGENT_DIR/hotmilk.json` (default `~/.pi/agent` when unset).

User-facing setup: [README.md](README.md).

## Commands (this repo)

| Command          | Purpose                   |
| ---------------- | ------------------------- |
| `bun install`    | Install deps (`bun.lock`) |
| `bun run test`   | `vp test` (same as CI)    |
| `bun run lint`   | `vp lint`                 |
| `bun run format` | `vp fmt --write`          |
| `bun run check`  | lint + format + test      |

Requires Node.js and Pi peer versions from **`package.json`** (`engines`, `peerDependencies`). This repo commits **`bun.lock`** only (no `package-lock.json`).

## Pi essentials

- **Runtime**: [Pi](https://pi.dev/docs) with `@earendil-works/pi-coding-agent` — install hotmilk via `pi install npm:hotmilk`.
- **Single extension entry**: only `./src/index.ts` is listed under `package.json` → `pi.extensions`. All other bundled packages load via **dynamic `import()`** when their toggle is `true`.
- **Config**: `$PI_CODING_AGENT_DIR/hotmilk.json` — change with `/mode`, apply with `/reload`. Test override: `HOTMILK_CONFIG_ROOT`.
- **Project trust**: `projectTrust` in `hotmilk.json`; handler in `src/bootstrap/project-trust.ts`. Bundled extension dedupe scans global settings only until trust (`includeProjectSettings: false` in `src/index.ts`). See [Pi project trust docs](https://pi.dev/docs/latest/security#project-trust).
- **Do not** add packages to `pi.extensions` for toggled deps; add one row to `BUNDLED_EXTENSION_DEFINITIONS` in `src/config/bundled-extensions.ts`.
- **Local runtime dirs (gitignored)**: `.agents/`, `graphify-out/`, `openspec/` — not package sources.
- **Graph tools**: `graphify` default on; `shazam` default off. Prefer graphify for recon — [README § Workflow routing](README.md#workflow-routing).

## Code layout

Full tree: [docs/directory.md](docs/directory.md). Startup / load order: [docs/design.md](docs/design.md).

| Path              | Role                                                                 |
| ----------------- | -------------------------------------------------------------------- |
| `src/index.ts`    | Extension entry: runtime, register handlers                          |
| `src/config/`     | `hotmilk.json` I/O, resolve, `createHotmilkRuntime()`                |
| `src/bootstrap/`  | Bundled registration, session, BTW, `/subagents-doctor`              |
| `src/controller/` | `/mode`, `/stop`, `/interrupt`                                       |
| `docs/`           | Architecture mermaid — [docs/README.md](docs/README.md)            |
| `skills/`         | First-party skills (`pioneer`, `update-docs`, …); deps via `pi.skills` |

## Agent behavior

Merge with your global agent guidelines when present. For this repo:

1. **Scope** — Touch only what the task requires; match existing patterns in `src/`.
2. **Simplicity** — No speculative features; keep lazy loading (`extensions.ts`) intact.
3. **Verify** — Run `bun run test` (and `bun run lint` when changing TS or config).
4. **Docs** — User-facing changes in `README.md`; update `hotmilk.json` when changing defaults (code reads it as the template).
5. **Workflow** — Plan/memory/optimize routing: [README § Workflow routing](README.md#workflow-routing) and [`skills/pioneer/SKILL.md`](skills/pioneer/SKILL.md).

## Where to read next

Progressive disclosure — load only what the task needs:

| Need                              | Read                                                                 |
| --------------------------------- | -------------------------------------------------------------------- |
| Install, toggles, samples         | [README.md](README.md)                                               |
| Startup, load order, config paths | [docs/design.md](docs/design.md)                                     |
| Repo tree                         | [docs/directory.md](docs/directory.md)                               |
| Pioneer phases, OpenSpec gates    | [docs/workflow.md](docs/workflow.md)                                 |
| Stack pins, CI                    | [docs/tech.md](docs/tech.md)                                         |
| Subagent prompts                  | [agents/](agents/) → copy to `.pi/agents/` for Pi discovery          |
| SDD / OpenSpec execute            | `/skill:gentle-ai`; local artifacts in `openspec/` (gitignored)      |
| Doc drift sync                    | [skills/update-docs/SKILL.md](skills/update-docs/SKILL.md)           |

Full index: [README § Documentation map](README.md#documentation-map).