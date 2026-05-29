# hotmilk

Pi **meta-package**: one install bundles gentle-pi, context-mode, graphify, subagents, and related extensions. User toggles live in `~/.pi/agent/hotmilk.json`.

User-facing setup: [README.md](README.md).

## Commands (this repo)

| Command         | Purpose                          |
| --------------- | -------------------------------- |
| `bun install`   | Install deps (`bun.lock`)        |
| `bun test`      | Vitest via vite-plus             |
| `bun run lint`  | `vp lint`                        |
| `bun run check` | lint + format + test             |

Requires **Node.js 22+**. Targets **Pi 0.77** (`@earendil-works/pi-coding-agent` peers).

## Pi essentials

- **Runtime**: [Pi](https://github.com/badlogic/pi-mono) with `@earendil-works/pi-coding-agent` — install hotmilk via `pi install npm:hotmilk`.
- **Single extension entry**: only `./src/index.ts` is listed under `package.json` → `pi.extensions`. All other bundled packages load via **dynamic `import()`** when their toggle is `true`.
- **Config**: `~/.pi/agent/hotmilk.json` — change with `/mode`, apply with `/reload`.
- **Do not** add packages to `pi.extensions` for toggled deps; add `BUNDLED_EXTENSION_IDS` + a loader in `src/bootstrap/extensions.ts`.

Details: [docs/pi.md](docs/pi.md).

## Code layout

| Path                             | Role                                                       |
| -------------------------------- | ---------------------------------------------------------- |
| `src/index.ts`                   | Extension entry: runtime, register handlers                |
| `src/config/`                    | `hotmilk.json` I/O, resolve, `createHotmilkRuntime()`      |
| `src/bootstrap/`                 | Bundled extension registration, session, graph, defaults   |
| `src/controller/`                | `/mode`, `/stop`, `/interrupt`                             |
| `src/ui/`                        | Footer, session logo                                       |
| `prompts/`, `skills/`, `themes/` | Shipped Pi assets (`pi.prompts`, `pi.skills`, `pi.themes`) |

## Agent behavior

Merge with your global agent guidelines when present. For this repo:

1. **Scope** — Touch only what the task requires; match existing patterns in `src/`.
2. **Simplicity** — No speculative features; keep lazy loading (`extensions.ts`) intact.
3. **Verify** — Run `bun test` (and `bun run lint` when changing TS or config).
4. **Docs** — User-facing changes in `README.md`; update `hotmilk.json` when changing defaults (code reads it as the template).
5. **Pi/runtime** — See [docs/pi.md](docs/pi.md).

## More

- [Extension toggles & troubleshooting](README.md#configuration)
