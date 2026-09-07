---
name: pioneer
description: End-to-end hotmilk workflow router for graph recon, planning, OpenSpec/SDD, execution, optimization, and prompt evaluation. Use for pioneer, architecture planning, bundled extension manifest work, hotmilk.json defaults, bundled-extensions.ts, graphify-out questions, openspec work, or multi-step implementation.
---

# Pioneer

Route work to one plan authority, then execute and verify it.

## Choose route

| Signal                                                | Route                                               |
| ----------------------------------------------------- | --------------------------------------------------- |
| One-file typo or known single-file fix                | Chat Plan, then direct execution                    |
| Medium scope with human approval as primary goal      | Plannotator                                         |
| Heavy research, parallel tracks, or `/clear` recovery | planning-with-files                                 |
| Large, ambiguous, cross-cutting, or explicit SDD work | OpenSpec SDD via `/skill:gentle-ai`                 |
| Measurable optimize/benchmark loop                    | `/skill:autoresearch-create` instead of a plan path |

Pick one plan authority. Add observational-memory for continuity, context-mode
for large output, and shazam for execute-time impact/verify; none replaces plan
artifacts.

## Capability fallbacks

- `graphify` off or unavailable: use [`graph-recon-gate.md`](references/graph-recon-gate.md).
- `goal` off: record objective in assumptions or proposal; see [`goal-gate.md`](references/goal-gate.md).
- `gentle-ai` off: OpenSpec is unavailable; use Chat Plan or Plannotator.
- `plannotator` off: use Chat Plan or OpenSpec.
- `planning-with-files` off: use Chat Plan, Plannotator, or OpenSpec.
- `autoresearch` off: use Chat Plan with an explicit benchmark.
- `subagents` off: execute inline and state delegation was skipped.
- `grill-with-docs` unavailable: skip grill and resolve terms in assumptions.

When multiple capabilities are off, apply each matching fallback. Do not call
missing tools or claim unavailable verification.

## Phases

1. **Recon:** use graphify before broad architecture search; read
   [`graph-recon-gate.md`](references/graph-recon-gate.md) when applicable.
2. **Goal:** use pi-goal only when a multi-turn objective is useful; see
   [`goal-gate.md`](references/goal-gate.md).
3. **Clarify:** grill only unresolved terms; one blocking question at a time.
4. **Plan:** choose Chat Plan, Plannotator, planning-with-files, or OpenSpec.
   Read that path's reference before starting it:
   [`chat-plan.md`](references/chat-plan.md),
   [`plannotator-routing.md`](references/plannotator-routing.md),
   [`openspec-routing.md`](references/openspec-routing.md), or the bundled
   planning-with-files skill.
5. **Execute:** use gentle-ai and subagents when enabled. Run
   `shazam_impact` before shared-module edits and `shazam_verify` after them
   when shazam is enabled.
6. **Harden:** after skill or prompt edits, run `/prompt-eval <path>`; see
   [`prompt-eval-gate.md`](references/prompt-eval-gate.md).

Skip phases that do not apply. Plan on turn one only when user asks for one or
scope is non-trivial. Do not grill when graph and supplied context answer it.

## Bundled extension changes

Keep extension id, default, dependency, lazy module path, and README aligned:
`src/config/bundled-extensions.ts`, `hotmilk.json`, `package.json`, and README.
Load bundles through `src/bootstrap/extensions.ts`; do not add toggled bundles
to `package.json` → `pi.extensions`.

## OpenSpec guard

OpenSpec requires `gentle-ai`. If an active change loses gentle-ai, stop
apply/verify/sync/archive and resume through `/sdd-status` and
`/sdd-continue` after re-enabling it. Do not re-plan the same change in chat.
Read [`openspec-routing.md`](references/openspec-routing.md) for recovery.

## Non-negotiable rules

- Do not mix Chat Plan, Plannotator, planning-with-files, and OpenSpec as
  competing authorities for one change.
- Do not start OpenSpec for a one-file typo.
- Do not combine autoresearch with SDD or another plan path for one task.
- Do not treat observational-memory or shazam as a plan authority.
- Do not skip verification, sync, or archive for active OpenSpec work.
- State selected route, unavailable capabilities, and verification performed.
