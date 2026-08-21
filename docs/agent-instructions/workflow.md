# Workflow Guidelines

Applies to every code or configuration change in hotmilk.

## Scope and implementation

- Touch only files required by the task; reuse patterns already present in `src/`.
- Keep lazy loading in `src/bootstrap/extensions.ts` intact.
- Do not add speculative features or abstractions. Match existing interfaces and load phases.
- For multi-file or architectural changes, use the routing guidance in [README § Workflow routing](../../README.md#workflow-routing) and [`skills/pioneer/SKILL.md`](../../skills/pioneer/SKILL.md).

## Verification

- Run `bun run test` for behavioral verification.
- Run `bun run lint` when changing TypeScript or configuration.
- `bun run check` runs formatting and lint; it does not replace `bun run test`.
- Run the smallest relevant smoke scenario for runtime or integration changes, then the full required checks before delivery.

## Documentation

- User-facing behavior changes belong in `README.md`.
- Update `hotmilk.json` when changing defaults; code reads it as the shipped template.
- Keep architecture diagrams and directory maps synchronized when startup or module layout changes.
- Do not document implementation claims that were not verified.
