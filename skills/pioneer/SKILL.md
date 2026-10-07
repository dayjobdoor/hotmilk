---
name: pioneer
description: Roadmap-anchored W-model development flow for any repository. Starts each change from a roadmap horizon item, pairs each build level (requirements, system design, detailed design, code) with its test design and a review gate, executes tests bottom-up, routes every failure back to the level that caused it, and syncs the roadmap on close. Use for pioneer, W-model, working on a ROADMAP item, multi-step or multi-file implementation, feature work, bug fixes that need a plan, or when test design should start before code.
---

# Pioneer

Run one change through the W-model, starting from the roadmap. The left arm
builds and designs tests at the same time; the right arm executes those tests
and fixes defects. Every level gets its checks before the next level starts,
so defects surface at the level that made them.

```text
Requirements ─ acceptance test design           acceptance test ─ fix
   System design ─ system test design         system test ─ fix
      Detailed design ─ integration test design   integration test ─ fix
         Code ─ unit test design             unit test ─ fix
                        └──── build ────┘
```

## Size the change

| Signal | Levels |
| ------ | ------ |
| Typo, one-line fix, known single-file change | Code only: write the unit check, change, run it |
| Bug fix or small feature in one module | Requirements + code |
| Multi-file, new behavior, or public contract change | All four levels |
| Scope, goal, or acceptance unclear | Stop at requirements; ask one blocking question |

Skip levels that do not apply and say which were skipped. Never skip the
check for a level you run.

## Anchor to the roadmap

If the repo has a roadmap (`ROADMAP.md`, `docs/roadmap*`, milestone docs), it
is the source of the requirements level. Read it before sizing.

1. **Pick the item**: quote the horizon item the change serves. A request that
   matches no item: say so and proceed only as a defect fix or on the user's
   go-ahead. Never add, remove, or re-scope roadmap items; that is the user's call.
2. **Respect sequencing**: when the roadmap orders work or names gates
   ("X first", "Y is the gate", "lands after Z"), check the prerequisites.
   An unmet gate stops the change at requirements; report which gate.
3. **Slice**: an item larger than one reviewable change gets a first slice;
   name the slice and what remains of the item.
4. **Principles are review criteria**: the roadmap's principles (and the
   rules docs they link) join the system-design review gate.

No roadmap: the user's request is the requirements source.

## Discover the gates

Before planning, read what the repo already defines; do not invent gates.

- Rules and order: `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`, the docs they link.
- Commands: `package.json` scripts, `Makefile`, `justfile`, `mise.toml`, `Cargo.toml`, `pyproject.toml`.
- CI: `.github/workflows/*` shows the gate that must pass.
- Test layout: existing test dirs, naming, fixtures. New tests follow them.

Map what you find to levels: lint/typecheck = static check for code; unit and
integration suites; a runnable entry point (CLI, server, UI) for system and
acceptance. If a level has no runner, its check is a throwaway smoke script.

## Left arm — build and design tests together

Write one W table in chat. No plan file unless the user asks.

```markdown
## Change
Horizon: <quoted roadmap item, or "none: defect/request"> — slice: <this change>
<problem in one sentence>
Known: <facts read> — Assumed: <unverified> — Unchanged: <what must not change>

| Level | Build | Test design | Review gate |
| ----- | ----- | ----------- | ----------- |
| Requirements | R1 … | A1 (R1): <command/action> → <expected> | Each R observable and testable; traces to the horizon item; sequencing gates met |
| System design | files, entry points, config touched | S1 (R1): <end-to-end run> → <expected> | Every R traced to a design element; roadmap principles hold |
| Detailed design | functions, interfaces, callers | I1: <seam/contract test> → <expected> | Callers of changed symbols found; interfaces named |
| Code | edit steps | U1: <unit test> → <expected> | lint/typecheck clean |
```

1. **Requirements**: derive numbered requirements (R1…) from the horizon item
   and the request. Design acceptance checks from the user's point of view
   before any design. A requirement with no observable check is not ready;
   fix it or ask (at most three targeted questions, only for decisions that
   change the implementation). Name what must stay unchanged.
2. **System design**: name the files, entry points, config, and docs the
   change touches. Design system checks that run the real program; for UI,
   name the viewports and states to exercise. When designs genuinely compete,
   list two or three options with trade-off and how each would be verified,
   then pick one.
3. **Detailed design**: name changed functions and interfaces; find every
   caller (LSP references first, text search second). Put decisions in pure
   functions (input → output, no I/O) that unit tests call directly; keep
   I/O and host/API calls in thin handlers that only wire them. Design
   integration checks at the seams the change crosses.
4. **Code**: write the unit tests first (failing), then the implementation.

The table is ready when someone else could execute it without guessing:
exact paths, ordered steps, a check per step.

Each review gate is a static test: run it before descending. A gate failure is
fixed at that level, not deferred to code.

## Right arm — execute bottom-up and fix at the source

1. Unit → integration → system → acceptance. Run each level's checks with the
   repo's commands; record observed output, not expectations.
2. On failure, trace it left: which level's build or test design is wrong?
   - Code defect → fix code, rerun unit.
   - Wrong interface or missed caller → fix detailed design, then code.
   - Wrong file or flow → fix system design and everything below it.
   - Wrong or missing requirement → fix requirements; ask the user when the
     intent is theirs to decide.
3. After any fix, rerun every level from the fixed one upward (regression).
4. Done = every acceptance check observed passing and the repo's full gate
   (lint + test, as CI runs it) green.

## Close

- Sync docs the requirements and system design touched, in the same change.
- Sync the roadmap using its own convention (e.g. an inline `done` note on the
  finished part); record what remains of a sliced item. Do not add checkboxes
  or progress logs the roadmap does not already use.
- Remove throwaway smoke scripts; keep only tests that catch plausible
  user-visible regressions and match repo conventions.
- Review the diff as a separate step, not as the author: every changed line
  traces to an R; no unrelated refactor or drift between code, config, and
  docs; a refactor preserves behavior (all prior tests pass unchanged) and
  keeps abstractions that still earn their place. Over ~400 changed lines,
  split into reviewable changes.
- Report: the W table with a result per check (`pass` / `fail` /
  `skipped: why`), changed files, risks and open questions, next step. On a
  timeout or partial run, list what finished and what remains; never report
  partial work as done. Cite `path:line` for findings.

## Rules

- One W table per change, anchored to one horizon item; it is the plan.
  Update it when a level changes.
- Test design precedes the build step it checks.
- Fix defects at the originating level; never patch a requirement or design
  error in code, and never weaken a test to pass it.
- Do not claim a level passed without its observed output.
- Product, architecture, or scope decisions that are not in the request go
  back to the user; do not improvise them.
