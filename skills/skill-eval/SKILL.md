---
name: skill-eval
description: Measure and harden a skill, prompt, or AGENTS.md section with fresh subagents. Frozen scenarios and checklists, a baseline arm without the target and a target arm with it, one minimal edit per iteration, a hold-out run before shipping. Use for skill-eval, "evaluate this skill", "does this prompt work", "harden this skill", "A/B this prompt", or after writing or editing a SKILL.md. Not for code review or app benchmarks.
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

| Stakes | Scenarios | Critical items | Iteration cap |
| ------ | --------: | -------------: | ------------: |
| High (security, data loss, release gate) | 3 | 2+ | none |
| Standard | 2 | 1+ | 5 |
| Low | 2 | 1+ | 3 |

- Scenarios: one median, one edge, plus one hold-out kept unseen until the end.
- Checklist per scenario: 3–7 observable items, at least one `[critical]`. A
  critical miss fails the scenario.
- Frozen means frozen: never edit scenarios or checklists after the first run.

## 2. Run both arms

Per scenario, dispatch two fresh subagents (pi: `subagent_run` with the
`subagents` row on; omp: `task`). Never reuse a child.

- **baseline**: scenario + checklist, no target text.
- **target**: the complete target text pasted in, then scenario + checklist.

Executor task:

```markdown
You are a fresh executor. Edit nothing outside a scratch dir; spawn no agents.
## Target Prompt        (target arm only)
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
- Retries: count and reason
- Duration: measured wall-clock, with units
```

Then one fresh reviewer per scenario gets the target, scenario, checklist, and
the full executor report, and scores it. Executors grading themselves do not count.

## 3. Harden (one delta per iteration)

1. Name the highest-impact ambiguity or critical miss.
2. Name the checklist item it fixes.
3. Edit only that semantic theme in the target.
4. Re-run the target arm with fresh children.

Stop when two consecutive iterations (three for High) show zero new
ambiguities, accuracy gain ≤ 3 points, steps within ±10%, duration within
±15%. Hit the cap or stall three times: stop and rewrite the target instead.
Last, run the hold-out once; a 15-point accuracy drop means overfit, apply
another delta.

## Output

```text
skill-eval <target>  stakes=<tier>  iterations=<N>
scenario   arm       critical  accuracy  steps  duration  ambiguities
median     baseline  ×         40        12     3m10s     -
median     target    ○         95        9      2m05s     1
edge       ...
hold-out   target    ○         90        10     2m30s     0
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

Edits only the target, one delta at a time. Code review: `pioneer-review`;
over-engineering: `ponytail-review`; optimisation loops over code metrics:
`autoresearch-create`.
