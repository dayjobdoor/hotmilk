# Plannotator (Phase 3b)

**Load when:** Plan routing chose **Plannotator** (human approval gate before execution).

**Do NOT load when:** Chat Plan, OpenSpec SDD, or planning-with-files is the chosen plan authority — use the matching reference instead.

## When to use

| Signal                                                                 | Route here                  |
| ---------------------------------------------------------------------- | --------------------------- |
| Medium scope, bounded checklist, human must approve plan before writes | Plannotator                 |
| User asks for plan review in browser, `/plannotator`, or `--plan`      | Plannotator                 |
| Gray zone where approval matters more than spec artifacts              | Plannotator over Chat Plan  |
| Cross-cutting, >400 changed lines, proposal/spec needed                | OpenSpec instead            |
| Heavy research, `/clear` recovery, findings/progress split             | planning-with-files instead |

**Tie-breaker vs OpenSpec:** approval is the primary goal → Plannotator; spec/design/tasks contract is the primary goal → OpenSpec.

## Prerequisites

| Requirement         | Check                                                                                           |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| Toggle              | `extensions.plannotator: true` — if off, fall back to Chat Plan or OpenSpec per pioneer routing |
| Extension           | `@plannotator/pi-extension` loaded via `/reload` after `/mode`                                  |
| Graph (recommended) | Phase 0 graph recon before planning — read `graphify-out/GRAPH_REPORT.md` when present          |

## Workflow

```text
1. Phase 0 graph recon (when non-trivial)
2. Optional /goal alignment
3. /plannotator plans/<name>.md  OR  --plan plans/<name>.md
4. Agent writes plan + checklist in planning phase (plan file only)
5. plannotator_submit_plan → browser Approve / Deny / Approve with notes
6. executing phase → gentle-ai Work Routing Ladder; mark [DONE:n] per item
7. Optional plannotator-review on diff before ship
```

## Artifact rules

| Artifact                                     | Owner                                                                      |
| -------------------------------------------- | -------------------------------------------------------------------------- |
| `plans/*.md`                                 | Plannotator (single plan authority)                                        |
| `task_plan.md`, `findings.md`, `progress.md` | planning-with-files — **do not share** with Plannotator plan path          |
| `openspec/changes/<change>/`                 | OpenSpec — Plannotator may gate **after tasks**, not replace SDD artifacts |

Link across layers in prose only (`See findings.md §3`) — do not make two files the same plan authority.

## Execute (Phase 4)

After browser approval, load **`/skill:gentle-ai`** and follow its Work Routing Ladder.

- `extensions.subagents: false` → inline execute; say delegation skipped
- `extensions.gentle-ai: false` → inline execute after approval; no SDD mid-flow

**Verify:** per-step checks in plan + **`AGENTS.md`** (`bun test`, `bun run check`).

## SDD combination (optional)

When OpenSpec tasks are complete and human approval is still required:

```text
sdd-tasks done → emit plan-review (tasks summary) → Plannotator approve → sdd-apply
```

SDD artifacts remain authoritative; Plannotator is the execution gate only.

## Fallback when Plannotator is off

- Say **"Plannotator skipped: extension off"**
- Re-route: approval needed → Chat Plan with explicit user OK in chat; spec needed → OpenSpec
- Do not invoke `/plannotator`, `plannotator_submit_plan`, or `--plan` mode

## Anti-patterns

| Do not                                                    | Do instead                                         |
| --------------------------------------------------------- | -------------------------------------------------- |
| Start Plannotator mid-active SDD as second plan authority | Finish or pause SDD; use plan-review on tasks only |
| Share `task_plan.md` with Plannotator                     | Separate paths: `.planning/` vs `plans/`           |
| Chat Plan then switch to Plannotator same task            | Pick one plan path at Phase 3                      |
| Skip browser approval and write source in planning phase  | Stay in planning until Approve                     |
