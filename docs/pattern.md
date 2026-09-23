# Quality gates

Lint and format design for hotmilk. Commands and CI pins: [tech.md](tech.md). When to run them: [testing.md](testing.md). Config files own the bits; this file owns **why** the gates exist.

## Commands

| Command | Purpose |
| ------- | ------- |
| `bun run lint` | Oxlint via vite-plus (`vp lint`); CI gate |
| `bun run format` | Formatter (`vp fmt --write`) |
| `bun run check` | Format check + lint (`vp check`); does not run tests |
| `bun run test` | Vitest via vite-plus |

Sources: [package.json](../package.json) scripts, [.github/workflows/publish.yml](../.github/workflows/publish.yml).

## Layers

1. **TypeScript**: `strict`, `verbatimModuleSyntax`, `noEmit`. See [tsconfig.json](../tsconfig.json).
2. **Oxlint**: type-aware lint and type-check in [vite.config.ts](../vite.config.ts).
3. **anti-slop**: custom Oxlint plugin in [tools/oxlint/anti-slop/](../tools/oxlint/anti-slop/). Blocks patterns that hide weak typing behind assertions, reflection, or `unknown` escape hatches.

`oxlint` and `@oxlint/plugins` are at **`^1.85.0`** in [package.json](../package.json).

## anti-slop intent

Parse external input once at I/O boundaries. Keep contracts explicit. Justify type assertions with a nearby `// SAFETY:` comment.

| Theme | Rules | Why |
| ----- | ----- | --- |
| Boundaries | `no-unknown-parameters`, `no-unknown-returns`, `no-unknown-type-aliases`, `no-unsafe-dictionary-type`, `no-runtime-typeof` | `unknown` stays at the edge, not in function contracts |
| Assertions | `no-chained-type-assertions`, `no-widen-then-assert`, `require-safety-comment-for-type-assertion` | Assertions document invariants TypeScript cannot express |
| Structure | `no-object-parameters`, `no-conditional-empty-object-spread`, `no-known-value-widening` | Avoid shapes that discard evidence the type checker already had |
| Reflection / tests | `no-reflect-apply`, `no-reflect-get`, `no-module-mocking` | Typed interfaces and real fakes instead of reflection or `vi.mock` |
| Naming | `no-shape-in-symbol-names` | Ban low-signal tokens in symbol names |

Rule severity: [vite.config.ts](../vite.config.ts) `lint.rules`. Implementations: [tools/oxlint/anti-slop/rules/](../tools/oxlint/anti-slop/rules/).

## Out of scope

Not covered by these gates:

- `node_modules`, `dist`, `graphify-out`, agent tool dirs (`.pi/`, `.agents/`, …), `openspec/`
- Anti-slop plugin source (`tools/oxlint/anti-slop/**`); excluded so rule code is not self-referential
- Bundled extension packages under `node_modules/`; lint targets this repo's `src/` and `test/`
- Formatter-only style (indent, quotes); `vp fmt` handles that; not repeated here

## Changing gates

1. New rule: add under `tools/oxlint/anti-slop/rules/`, register in `index.ts`, enable in `vite.config.ts`.
2. Pin bump: update `oxlint`, `@oxlint/plugins`, and any plugin API drift in rule files together.
3. Record **why** in this file when a gate encodes a project decision tests cannot state alone.
