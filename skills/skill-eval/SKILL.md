---
name: skill-eval
description: A/B-measure and harden a skill, prompt, or AGENTS.md section with fresh subagents (baseline vs target, one edit per iteration, hold-out). Use for skill-eval, "evaluate this skill", "A/B this prompt", スキル評価. Not for static rubric review, code review, or app benchmarks.
argument-hint: "<path to SKILL.md, prompt file, or AGENTS.md section>"
---

# Skill eval

A target is only as good as what a blank-slate agent does with it. Measure
that, never your own re-reading. The parent is the sole editor; executors and
reviewers never edit files or spawn agents.

## 0. Static check

Read the target. Its frontmatter `description` (or opening promise) must match
the body: triggers, scope, outputs. Fix mismatches before any run.

## 1. Freeze

| Stakes                                   | Scenarios + hold-out | Critical items per scenario | Iteration cap |
| ---------------------------------------- | -------------------: | --------------------------: | ------------: |
| High (security, data loss, release gate) |                3 + 1 |                          2+ |          none |
| Standard                                 |                2 + 1 |                          1+ |             5 |
| Low                                      |                2 + 1 |                          1+ |             3 |

- Scenarios: one median, one edge (High adds a second edge); the hold-out
  stays unseen until the end.
- Checklist per scenario: 3–7 observable items, with the tier's count of
  `[critical]` items. A critical miss fails the scenario.
- Frozen means frozen: never edit scenarios or checklists after the first run.

## 2. Run both arms

Per scenario, dispatch two fresh subagents with the host's own subagent tool
(omp: `task`). Never reuse a child. No such tool: see the honesty boundary.

- **baseline**: scenario + checklist, no target text.
- **target**: the complete target text pasted in, then scenario + checklist.

Executor task:

```markdown
You are a fresh executor. Edit no files; spawn no agents.

## Target Prompt (target arm only)

<full target text>
## Scenario
<one scenario>
## Checklist
1. [critical] <observable item>
2. <observable item>
## Return
- Deliverable: artifact or run summary
- Status per item: ○ / partial / × with reason
- Ambiguities: wording that needed interpretation
- Discretionary fills: decisions the target did not specify

Put the complete deliverable in your final message; nothing else is read.
```

Then one fresh reviewer per scenario gets the target, scenario, checklist, and
the full executor report, and scores it: accuracy = ○ items + 0.5 × partial,
÷ total items, × 100, minus 5 per verified false repo claim. Executors grading
themselves do not count. A report whose deliverable body is missing is a
harness failure: rerun that child, never score it as a target miss.

## 3. Harden (one delta per iteration)

1. Name the highest-impact ambiguity or critical miss.
2. Name the checklist item it fixes.
3. Edit only that semantic theme in the target.
4. Re-run the target arm with fresh children.

Stop when two consecutive iterations (three for High) show zero new
ambiguities and an accuracy gain ≤ 3 points. At the cap, or after three
iterations without a critical-item gain, stop (`cap` / `stalled`) and report
that the target needs a rewrite; a rewrite is a new eval run. After
convergence (not after `cap` / `stalled`), run the hold-out once; a 15-point
drop from the last target-arm accuracy stops the run (`overfit`): the next
delta is a new eval run with a new hold-out.

## Output

```text
skill-eval <target>  stakes=<tier>  iterations=<N>
scenario   arm       critical  accuracy  ambiguities
median     baseline  ×         40        0
median     target    ○         95        1
edge       ...
hold-out   target    ○         90        0
deltas: 1) <ambiguity> → <item> → <edit>
stop: <converged | cap | stalled | overfit>
accepted ambiguities: <list or 0>
```

Write `0` for an empty metric, never leave it blank. If the target arm does not
beat baseline on any critical item, say so: the target adds nothing yet.

## Honesty boundary

Every number comes from an observed child run. No fresh subagent available:
print `skill-eval skipped: no fresh agent available` and stop. Never estimate a
score, never claim convergence without the hold-out, never count a
structural-only read as a run.

## Boundaries

Edits only the target, one delta at a time. Plan-conformance review of a
diff: `pioneer-review`. Not for code review or optimisation loops over code metrics.
