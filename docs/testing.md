# Testing

Which checks prove which requirements. Gate design: [pattern.md](pattern.md). Stack pins: [tech.md](tech.md). Change flow (plan, test first, docs sync): [maintenance.md](maintenance.md#change-flow).

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

Push to `main`: `bun install --frozen-lockfile` → `bun run lint` → `bun run test`, plus the `omp-audit` job (`bun run audit:omp` against the pinned omp) → publish when version is new ([maintenance.md](maintenance.md)).

## Test areas

| Area | Files | Requirements covered |
| ---- | ----- | -------------------- |
| Config I/O and resolve | `hotmilk-config.test.ts` | Seed, load, save, toggles, defaults, trust, graph settings |
| Bundled manifest | `bundled-extensions.test.ts`, `extensions-lazy.test.ts` | Registry completeness, lazy load, context-stack order, loader errors |
| omp compatibility | `bun run audit:omp` (needs `omp`; CI job `omp-audit` installs the pinned release) | omp version equals `OMP_AUDITED_VERSION`; each row's `omp` flag matches whether it loads and registers a command or tool |
| Module resolution | `resolve-bundled.test.ts` | Nested/hoisted bundled dep paths |
| Startup integration | `startup.test.ts` | Entry wiring (all-off / toggles-on), two-copy yield, session handlers, ctx_search capture, rtk sync notice at session start |
| Dedupe and two-copy | `global-extension-sources.test.ts` | Pi-settings dedupe scan, npm copy yields to a project hotmilk checkout |
| Context / RTK | `context-stack.test.ts` | Pure `alignRtkConfig`, RTK sync I/O |
| TUI | `footer.test.ts`, `logo.test.ts`, `mode.test.ts`, `input.test.ts` | Footer, startup intro, `/mode`, `/stop`, `/interrupt` |
| Trust / defaults | `project-trust.test.ts`, `caveman-defaults.test.ts` | Trust decisions, persona, caveman+ja warning |
| Supply chain | `third-party-risk.test.ts`, `pi-manifest-assets.test.ts` | Peer floors, published `pi.*` paths exist |
| Shims | `kanagawa-shim.test.ts`, `autoresearch-shortcuts.test.ts` | `/thinking` skip, shortcut seed |

- Shared fixtures: `test/fixtures/runtime.ts` (`allExtensionsDisabled`, `testRuntime`, `setEnv`, `withConfigEnv`), `recording-pi.ts`, `tmp.ts`, `manifest.ts`.

## Conventions

- Contract-first (testing-principles skill): one top-level test per observable contract; merge scenarios only when they share the same workflow (same handler, factory, or file under test); never pad with per-id parameter sweeps when one representative row proves the lookup.
- Config/env setup uses `withConfigEnv(configRoot, agentDir, async () => { ... })`; no hand-rolled try/finally env juggling.
- Integration tests assert wiring outcomes only when a unit test already pins the detail (e.g. session start reports the RTK sync result; its alignment is pinned in `context-stack.test.ts`).
- Real bundled modules load through `resolve-bundled` spies with `test/fixtures/order-marker-*.ts`; 30s timeouts mark those loads.
