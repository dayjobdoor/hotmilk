---
description: Harden a prompt or skill with fresh subagent evaluation loops
argument-hint: "<path to SKILL.md, AGENTS.md section, or prompt file>"
---

Run a parent-controlled prompt hardening loop for the target below.

Target:

$@

Parent is sole editor. Executors and reviewers never edit files or spawn agents.
Use fresh child sessions every iteration; never reuse an executor or reviewer.

## Step 0 — Static coherence

Read the target. Compare its frontmatter or opening promise with its body.
Fix trigger and scope mismatches before dispatching children.

## Step 1 — Baseline

Choose a stakes tier:

| Stakes   | Scenarios | Critical items | Iteration cap |
| -------- | --------: | -------------: | ------------: |
| High     |         3 |             2+ |          none |
| Standard |         2 |             1+ |             5 |
| Low      |         2 |             1+ |             3 |

Use one median and one edge scenario at minimum. Freeze scenarios and
checklists before evaluation. Each checklist has 3–7 observable items and
at least one `[critical]` item. A critical miss fails its scenario.

Paste the complete target text into every executor task. If no fresh
subagent is available, report `prompt-eval skipped: no fresh agent available`.

## Step 2 — Evaluation loop

For every scenario, dispatch one fresh executor:

```text
subagent({
  agent: "assistant",
  context: "fresh",
  skill: false,
  clarify: false,
  model: "<explicit-model-id>",
  task: "<full target text, one scenario, and frozen checklist>"
})
```

Executor contract:

```markdown
You are a fresh executor reading the target as a blank slate.

## Target Prompt

<full target text>

## Scenario

<one scenario>

## Requirement Checklist

1. [critical] <observable item>
2. <observable item>

## Task

Execute the scenario. Return:

- Deliverable: artifact or run summary
- Requirement status: ○ / partial / × for every item, with reasons
- Ambiguities: wording that required interpretation
- Discretionary fills: decisions not specified by the target
- Retries: count and reason
- Measured duration: elapsed wall-clock time for the scenario, with units
```

In every reviewer task, include this complete packet for its scenario:

```markdown
## Target Prompt

<full target text>

## Scenario

<one scenario>

## Requirement Checklist

<frozen checklist>

## Executor Report

<complete executor report, including measured duration>
```

Score each scenario for critical success, accuracy, steps, duration, retries,
ambiguities, and discretionary fills. Qualitative ambiguity signals outrank speed.

The parent applies exactly one minimal semantic delta per iteration:

1. Name the highest-impact ambiguity.
2. Name the checklist item it fixes.
3. Edit only that semantic theme.
4. Record scenarios, scores, new ambiguities, discretionary fills, and next edit.

Re-dispatch fresh executors after every delta. Do not self-review.

## Stopping

Standard convergence requires two consecutive iterations with:

- zero new ambiguities;
- accuracy gain of at most three points;
- steps within ±10%;
- duration within ±15%.

High stakes requires three consecutive clears. Stop at the tier iteration cap
for low or standard stakes. Stop and rewrite after three stalled iterations.
Before shipping, run one fresh hold-out scenario. A 15-point accuracy drop
means the prompt overfit and needs another delta.

## Completion report

Report the stakes tier, scenarios, iterations and deltas, final scores,
hold-out result, stop reason, and remaining accepted ambiguities. Write `0`
instead of leaving any metric blank.

## Red lines

- Never reuse child sessions.
- Never change frozen checklists.
- Never apply unrelated edits in one iteration.
- Never treat self re-reading as fresh evaluation.
- Never claim convergence without the hold-out scenario.

For structural-only review, mark the request `structural-audit mode: check
textual coherence only, do not execute.` Structural review cannot count toward
convergence.
