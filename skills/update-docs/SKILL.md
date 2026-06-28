---
name: update-docs
description: Sync documentation to code and config — README, CONTRIBUTING, AGENTS.md, CLAUDE.md, docs/, manifests, CI, config templates (e.g. hotmilk.json), and post-merge doc drift. Use for /update-docs, update docs, sync docs, docs drift, stale README, or after changes to commands, defaults, toggles, dependencies, or module layout.
---

# Update docs

Reconcile docs with **code and config as source of truth**. Fix drift; do not rewrite for voice or expand scope.

## Scenario router (read first)

| User signal                                    | Route                                                                                                                     |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| "Sync all docs" / post-release / manifest work | **Full** — Phase 0 → 4; read entire [`doc-inventory.md`](references/doc-inventory.md)                                     |
| Named file only (`README`, one doc file)       | **Targeted** — Phase 1–3 on that file + its truth sources from inventory                                                  |
| User just shipped code; docs maybe stale       | **Post-ship** — read ONLY **Post-ship triggers** in `doc-inventory.md`; do NOT load `drift-verification.md` until Phase 4 |
| User wants new docs / rewrite tone             | **Stop** — sync fixes truth; ask whether to write new content separately                                                  |

**References:** Do **not** read `references/` until a phase below requires it. Each reference states load conditions at the top.

## Phase map

Skip phases that do not apply. State which phase was skipped and why.

```text
0. Scope           → doc-inventory.md          (Full sync — MANDATORY READ ENTIRE FILE)
1. Recon           → truth files + target docs (read-only)
2. Diff            → drift list only           (no edits yet)
3. Patch           → minimal surgical edits    (one theme per pass unless user asked batch)
4. Verify          → drift-verification.md     (MANDATORY READ ENTIRE FILE before reporting done)
```

## Recon rules (Phase 1)

| Rule            | Detail                                                                                                                                    |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Truth first     | Read listed source-of-truth files before editing any doc                                                                                  |
| No invention    | If truth is silent, report the gap — do not guess commands, paths, or defaults                                                            |
| Truth conflicts | When doc, manifest, and CI disagree: **CI > manifest scripts/targets > source comments**; report the conflict instead of picking silently |
| Scope           | Touch only doc files implicated by the diff; no drive-by style edits                                                                      |
| Language        | Match each file's existing language and heading style                                                                                     |

## Patch rules (Phase 3)

| Do                                                                         | Do not                                                                     |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Fix factual drift (commands, paths, defaults, version pins, module layout) | Rewrite unrelated sections for "clarity"                                   |
| Keep tables and lists aligned when two docs cover the same fact            | Duplicate long prose — prefer one canonical section + link                 |
| Update config samples when **code** defaults changed                       | Change runtime defaults in code while "fixing" docs unless user asked      |
| Preserve technical terms and command literals                              | Translate or rephrase during drift sync unless user asked for localization |

## Output (Phase 4)

Emit after the verify checklist passes (or list blockers):

```markdown
## Doc sync report

**Scope:** full | targeted | post-ship
**Truth sources read:** …
**Files patched:** … (or none)

### Drifts fixed

- …

### Gaps (no truth — not patched)

- …

### Verify

- [ ] …
```

## Anti-patterns

| Do not                                                              | Why                                     | Do instead                                       |
| ------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------------ |
| Read `references/` without a matching route                         | Token waste                             | Router row first                                 |
| Edit docs before reading truth files                                | Propagates stale claims                 | Phase 1 recon                                    |
| Full README rewrite on a targeted request                           | Review noise                            | Named file only                                  |
| Add a `docs/` tree when the repo has none                           | Scope creep                             | Skip; mention only if user wants new docs        |
| "Improve" prose without drift                                       | Style ≠ sync                            | Diff list must cite a truth mismatch             |
| Skip verify after patch                                             | Drift returns unnoticed                 | Phase 4 checklist                                |
| Copy root manifest commands into every package README in a monorepo | Wrong scope; breaks package-local truth | Root ↔ root manifest; package ↔ package manifest |
