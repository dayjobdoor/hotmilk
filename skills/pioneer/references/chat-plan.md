# Chat Plan (Phase 3a)

**Load when:** Plan routing chose **Chat Plan** (light path).

**Do NOT load when:** OpenSpec SDD path is chosen — use [`openspec-routing.md`](openspec-routing.md) instead.

## Template

```markdown
## Context

## Assumptions

## Tradeoffs

## Risks

Plan:

1. … — verify: …
2. …
```

## Persist

Chat only — do not create `docs/plans/` unless the repo already uses that convention.

## Step ordering

1. Apply grill doc proposals (CONTEXT/ADR patches) when proposed.
2. Recon/design from graph output when available.
3. Implementation steps with concrete `verify:` checks per **`AGENTS.md`** commands.

## Execute (Phase 4 chat path)

Work plan steps in order. Each step ends with its `verify:` check before the next step starts.

**Delegation:** load **`/skill:gentle-ai`** and follow its Work Routing Ladder. When `extensions.subagents: false`, execute inline and say delegation was skipped.

**When gentle-ai is unavailable** (toggle off or skill resolution step 3): pioneer inline execute — no SDD, no subagents.

```text
1. Implement step N inline (single writer thread).
2. Run verify from AGENTS.md (e.g. bun test) — record pass/fail.
3. Say: "gentle-ai unavailable — inline execute; SDD and delegation skipped."
```

**Verify:** use repo commands from **`AGENTS.md`** (`bun test`, `bun run check`, lint/format when defined). Record pass/fail per step.

**Control:** `/stop` halts the current turn cleanly; `/interrupt` cancels mid-stream. Say which control was used if execution pauses before plan completion.
