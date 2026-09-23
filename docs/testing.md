# Testing

Which checks prove which requirements. Gate design: [pattern.md](pattern.md). Stack pins: [tech.md](tech.md).

Sources: [package.json](../package.json) scripts, [.github/workflows/publish.yml](../.github/workflows/publish.yml), `test/`.

## Commands

| Command | Proves |
| ------- | ------ |
| `bun run test` | Behavioral contracts (`vp test` / Vitest); **CI gate** |
| `bun run lint` | Oxlint + anti-slop on `src/` and `test/`; **CI gate** |
| `bun run check` | Format + lint (`vp check`); does **not** run tests |
| `bun run format` | `vp fmt --write` |

Run `bun run test` and `bun run lint` before delivery. Use the smallest relevant test file for localized changes, then full suite.

## CI

Push to `main`: `bun install --frozen-lockfile` → `bun run lint` → `bun run test` → publish when version is new ([maintenance.md](maintenance.md)).

## Test areas

| Area | Files | Requirements covered |
| ---- | ----- | -------------------- |
| Config I/O and resolve | `hotmilk-config.test.ts` | Seed, load, save, toggles, defaults, trust, graph settings |
| Bundled manifest | `bundled-extensions.test.ts`, `extensions-lazy.test.ts` | Registry completeness, lazy load, context-stack order, loader errors |
| Module resolution | `resolve-bundled.test.ts` | Nested/hoisted bundled dep paths |
| Startup integration | `startup.test.ts` | Entry wiring (all-off / toggles-on), two-copy yield, session handlers, ctx_search capture, context-stack + MCP at session start |
| Dedupe and two-copy | `global-extension-sources.test.ts` | Pi-settings dedupe scan, npm copy yields to a project hotmilk checkout |
| BTW | `btw-hotmilk.test.ts` | Prompt strip, tool sets, proxies, append prompt |
| Context / RTK | `context-stack.test.ts`, `mcp-prune.test.ts` | RTK sync, MCP dedupe |
| TUI | `footer.test.ts`, `mode.test.ts`, `input.test.ts` | Footer, `/mode`, `/stop`, `/interrupt` |
| Trust / defaults | `project-trust.test.ts`, `caveman-defaults.test.ts` | Trust decisions, persona, caveman+ja warning |
| Supply chain | `third-party-risk.test.ts`, `pi-manifest-assets.test.ts` | Peer floors, published `pi.*` paths exist |
| Shims | `kanagawa-shim.test.ts`, `autoresearch-shortcuts.test.ts` | `/thinking` skip, shortcut seed |

- Shared fixtures: `test/fixtures/runtime.ts` (`allExtensionsDisabled`, `testRuntime`, `setEnv`, `withConfigEnv`), `recording-pi.ts`, `tmp.ts`, `manifest.ts`.

## Conventions

- Contract-first (testing-principles skill): one top-level test per observable contract; merge scenarios only when they share the same workflow (same handler, factory, or file under test); never pad with per-id parameter sweeps when one representative row proves the lookup.
- Config/env setup uses `withConfigEnv(configRoot, agentDir, async () => { ... })`; no hand-rolled try/finally env juggling.
- Integration tests assert wiring outcomes only when a unit test already pins the detail (e.g. session-start delegates RTK sync to `context-stack.test.ts`).
- Real bundled modules load through `resolve-bundled` spies with `test/fixtures/order-marker-*.ts`; 30s timeouts mark those loads.

## Change rules

- Touch only files required by the task; reuse patterns in `src/`.
- Keep lazy loading in `src/bootstrap/extensions.ts` intact.
- Do not add speculative abstractions or test-only production hooks without cause.
- Multi-file work: [README § Workflow routing](../README.md#workflow-routing) and [`skills/pioneer/SKILL.md`](../skills/pioneer/SKILL.md).

## Documentation after code changes

- User-facing behavior → [README.md](../README.md).
- TUI surfaces → [DESIGN.md](../DESIGN.md); theme colors → [themes/monokai.json](../themes/monokai.json).
- Registry default changes → `defaultEnabled` in bundled registry and `hotmilk.json` template.
- Layout/startup changes → [architecture.md](architecture.md), [directory.md](directory.md).
