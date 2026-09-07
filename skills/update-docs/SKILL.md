---
name: update-docs
description: "Use when existing README.md, AGENTS.md, docs/, manifests, CI, or config templates may have factual drift after code or configuration changes. For greenfield documentation, use make-docs instead."
---

# Update docs

Reconcile docs with **code and config as source of truth**. Preserve the repository's document layout; fix drift, do not normalize filenames or expand scope.

## Scenario router (read first)

| User signal                                                   | Route                                                                                                                     |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| "Sync all docs" / post-release / repo-wide manifest migration | **Full** — Phase 0 → 4; read entire [`doc-inventory.md`](references/doc-inventory.md)                                     |
| Named file only (`README`, one doc file)                      | **Targeted** — Phase 1–4 on that file + its truth sources; load only relevant inventory rows when mapping is unknown      |
| User just shipped code; docs maybe stale                      | **Post-ship** — read ONLY **Post-ship triggers** in `doc-inventory.md`; do NOT load `drift-verification.md` until Phase 4 |
| Existing docs need a justified topic added                    | **Targeted** — Phase 1–4 on the new topic; record its owner and source of truth; do not redesign the document tree        |
| User wants a new docs tree / rewrite tone                     | **Stop** — use make-docs only for greenfield bootstrap; sync fixes truth, not prose style or new content                  |

**References:** Do **not** read `references/` until a phase below requires it. Each reference states load conditions at the top.

Targeted sync: when the target and its source of truth are known, read them directly and skip `doc-inventory.md`. When the mapping is unknown, read only the relevant inventory rows; do not load the full inventory by default.

CI や manifest を truth source として読むだけでは Full にならない。named document が対象なら Targeted、repo-wide の変更が対象なら Full。

最初に user signal で scope を決める。conflict の種類や no-drift の結果で route は変更しない。recon-only は Targeted/Post-ship なら Phase 1–2、Full なら Phase 0–2 で終了する限定的な例外で、Phase 3–4 の完了報告はしない。

## Route precedence

Apply the first matching signal:

1. New docs tree or rewrite request → **Stop**
2. Explicit all-docs, post-release, repo-wide, or manifest-wide migration → **Full**
3. Named document or justified topic → **Targeted**
4. Recent shipped code with no named target → **Post-ship**

Reading CI or a manifest as truth never changes the selected route.

## make-docs handoff

- `make-docs` owns greenfield bootstrap only when `docs/`, `README.md`, and `AGENTS.md` are absent.
- Existing documentation stays in its repository-specific layout. Do not rename, split, overwrite, or create catalog placeholders to match a generic file list.
- Use the inventory as a coverage map, not a required filename catalog. Patch only missing, justified topics or factual drift.

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

| Rule            | Detail                                                                                                                                                                                              |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Truth first     | Read listed source-of-truth files before editing any doc                                                                                                                                            |
| No invention    | If truth is silent, report the gap — do not guess commands, paths, or defaults                                                                                                                      |
| Truth conflicts | For command claims, apply **CI > manifest scripts/targets > source comments** and record the resolved drift; outside those scopes, report unresolved conflicts in `Gaps` and do not choose silently |
| Scope           | Touch only doc files implicated by the diff; no drive-by style edits                                                                                                                                |
| Language        | Match each file's existing language and heading style                                                                                                                                               |

### Truth ownership

- CI owns CI commands and pipeline behavior.
- The manifest owns scripts, dependencies, entry points, and published files.
- Executable code or schemas own runtime behavior and defaults.
- Config templates own values users copy; README samples must match them.

Executable defaults and config-template values may serve different owners. If they disagree and intent is not explicitly reconciled, report the conflict in `Gaps`; do not apply command precedence.

- When truth sources conflict outside these scopes, report the conflict in `Gaps`; do not choose silently.

## Patch rules (Phase 3)

| Do                                                                                                      | Do not                                                                     |
| ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Fix factual drift (commands, paths, defaults, version pins, module layout)                              | Rewrite unrelated sections for "clarity"                                   |
| Keep tables and lists aligned when two docs cover the same fact                                         | Duplicate long prose — prefer one canonical section + link                 |
| Update config samples only after code/template intent is reconciled; match the template's copied values | Change runtime defaults in code while "fixing" docs unless user asked      |
| Preserve technical terms and command literals                                                           | Translate or rephrase during drift sync unless user asked for localization |

## Output (Phase 4)

Emit after the verify checklist passes (or list blockers):

```markdown
## Doc sync report

**Scope:** full | targeted | post-ship
**Truth sources read:** …
**Files patched:** … (or none)

### Drifts fixed

- …

### Gaps (unresolved, ambiguous, or out of scope — not patched)

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
