---
description: Harden a prompt or skill with fresh subagent evaluation loops
argument-hint: "<path to SKILL.md, AGENTS.md section, or prompt file>"
---

Run a parent-orchestrated prompt hardening loop for the target below.

Target:

$@

Keep this parent session as loop controller and sole editor. Child subagents must not spawn subagents, edit files, or inherit authoring context.

## Core rule: fresh executor

A prompt's quality is opaque to its author. Dispatch a **new** fresh executor every iteration. Self re-reading never qualifies.

Always set on executor and instructor dispatches:

- `context: "fresh"`
- `skill: false`
- `clarify: false`
- explicit `model` when the default resolver fails

**NOT fresh**: `context: "fork"`, same session, or reusing a prior executor's thread.

If `subagent` is unavailable, ask the user to open a separate session or report `prompt-eval skipped: no fresh agent available`. Never substitute self re-reading.

## Step 0 — Static coherence check (parent inline)

Before any dispatch, compare what the target **advertises** vs what the body **delivers**. Fix divergences first.

| Target type                   | "Advertises" source          | Check                                       |
| ----------------------------- | ---------------------------- | ------------------------------------------- |
| Skill file                    | Frontmatter `description`    | Triggers/use-cases match body coverage?     |
| CLAUDE.md / AGENTS.md section | Section heading              | Heading promise matches actionable content? |
| Task prompt / system prompt   | Opening instruction or title | Stated goal matches the actual rules?       |

Skipping this causes false positives — the fresh executor silently re-interprets the body.

## Step 1 — Baseline (parent inline)

1. Read the target file and freeze one stakes tier:

| Stakes                            | Scenarios             | `[critical]` tags | Stop condition       | Iteration cap |
| --------------------------------- | --------------------- | ----------------- | -------------------- | ------------- |
| **High** (core skill, automation) | 3 (1 median + 2 edge) | ≥ 2               | 3 consecutive clears | none          |
| **Standard** (default)            | 2 (1 median + 1 edge) | ≥ 1               | 2 consecutive clears | 5             |
| **Low** (small, low-blast)        | 2 (1 median + 1 edge) | ≥ 1               | ship at 80%          | 3             |

2. Design scenarios and requirement checklists. Do not change checklists after seeing results.

Checklist rules:

- 3–7 items per scenario.
- At least one `[critical]` item — without it, success judgment is vacuous.
- Translate user complaints into observable criteria (e.g. "shallow" → "names at least one concrete bug with line reference").
- `[critical]` failure = whole scenario fails (binary ×), regardless of other items.
- Non-critical items: ○ = 1, partial = 0.5, × = 0. Accuracy = sum / total.

3. Paste the **full target prompt text** into every executor task (not a path).

## Step 2 — Evaluation loop

Repeat until convergence, iteration cap, or divergence. Each iteration:

### 2a. Fresh executor (one per scenario)

For each scenario, launch:

```text
subagent({
  agent: "assistant",
  context: "fresh",
  skill: false,
  clarify: false,
  model: "<explicit-model-id>",
  task: "<executor contract below with full pasted prompt + one scenario + its checklist>"
})
```

Executor task contract:

```markdown
You are an executor reading <target prompt name> as a blank slate.
You have no prior exposure to this prompt; treat it as newly encountered.

## Target Prompt

<paste the full target prompt here>

## Scenario

<one paragraph describing the situation>

## Requirement Checklist

1. [critical] <item>
2. <item>
   ...

## Task

1. Execute the scenario following the target prompt and produce the deliverable.
2. On completion, respond with the report below.

## Report Structure

- Deliverable: <the artifact or run summary>
- Requirement status: for each item, ○ / × / partial (with reason)
- Ambiguities: places where wording was open to interpretation (bullets)
- Discretionary fills: decisions the instructions did not specify (bullets)
- Retries: how many times you redid a decision and why
```

Parallel scenarios: use `subagent({ tasks: [...] })` with models from the **same provider** only.

### 2b. Instructor scoring (fresh reviewer)

Launch one fresh reviewer per iteration (or one per scenario when scenarios are large):

```text
subagent({
  agent: "reviewer",
  context: "fresh",
  skill: false,
  clarify: false,
  model: "<explicit-model-id>",
  task: "Score executor reports using the rubric below. Return: per-scenario Success/Accuracy/Steps/Duration/Retries table, new ambiguities, new discretionary fills, and the single highest-impact ambiguity to fix next. Qualitative signals outweigh raw speed."
})
```

Instructor rubric:

| Axis                    | Source                | How to measure                                                                                                                                        |
| ----------------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Success/Failure**     | Instructor (reviewer) | ○ only if every `[critical]` met. Binary.                                                                                                             |
| **Accuracy**            | Instructor            | ○/partial/× per item → percentage                                                                                                                     |
| **Step count**          | Environment metadata  | `tool_uses` or tool-use blocks. Text-only targets: count review comments, checklist items, or code blocks — state the unit once in the iteration log. |
| **Duration**            | Environment metadata  | `duration_ms` or wall-clock                                                                                                                           |
| **Retry count**         | Self-report           | Times the agent redid a decision                                                                                                                      |
| **Ambiguities**         | Self-report           | Primary signal for improvement                                                                                                                        |
| **Discretionary fills** | Self-report           | Surfaces implicit requirements                                                                                                                        |

Weighting: ambiguities and discretionary fills are primary. Quantitative metrics are supporting. Chasing time alone makes prompts brittle.

On failure: append one line to Ambiguities naming which `[critical]` item dropped.

Step-count skew (even at 100% accuracy): one scenario at 3–5× the others → prompt lacks self-containment for that case. Fix with inline guidance or a minimal complete example.

Reviewers must not edit files. They score from executor self-reports plus environment metadata when available.

### 2c. Parent applies ONE delta

1. Identify the most impactful ambiguity from the instructor report.
2. State which checklist item the edit satisfies.
3. Apply the minimum edit to the target file — one semantic theme only.
4. Record the iteration:

```
## Iteration N

### Changes (delta from previous)
- <one-line edit description>

### Results
| Scenario | Success | Accuracy | Steps | Duration | Retries |
|---|---|---|---|---|---|
| A | ○ | 90% | 4 | 20s | 0 |
| B | × | 60% | 9 | 41s | 2 |

### Ambiguities (new this iteration)
- <Scenario B>: [critical] item N was × — <reason>
- <Scenario A>: (none new)

### Discretionary fills (new this iteration)
- <Scenario B>: <what was filled>

### Next edit
- <one-line minimal edit>

(Convergence: X consecutive clears / Y iterations until stop)
```

Never leave an axis blank (write "0", not "—"). "None new" is explicit signal.

Delta rules: one semantic theme per iteration. A cluster of 2–3 related micro-edits is one theme; unrelated edits go to the next iteration.

### 2d. Re-evaluate

Dispatch **new** fresh executors. Never reuse prior executor threads.

## Stopping

**Converged** when for N consecutive iterations (N = 2 standard, 3 high-stakes):

- New ambiguities: 0
- Accuracy gain: ≤ +3 points
- Step count change: within ±10%
- Duration change: within ±15%

**Diverged**: after 3+ iterations ambiguities aren't decreasing → stop patching, rewrite.

**Resource cutoff**: ship at 80% when improvement cost exceeds prompt importance.

Before declaring done on any tier, run one hold-out scenario not used earlier. Accuracy drop ≥ 15 points → overfitting; return to scenario design.

## Completion summary

Report:

- stakes tier and scenarios used
- iterations run and deltas applied
- final per-scenario scores
- hold-out result (if run)
- plateau reason (converged / cap / diverged / skipped)
- remaining ambiguities worth accepting or deferring

## Red flags

| Rationalization                                  | Reality                                                          |
| ------------------------------------------------ | ---------------------------------------------------------------- |
| "Re-reading it myself is equivalent."            | Structurally impossible to objectively view text you just wrote. |
| "One scenario is enough."                        | Overfits. Minimum 2.                                             |
| "Zero ambiguities once, so done."                | May be coincidence. Require consecutive clears.                  |
| "Fix multiple things in one pass."               | Lose attribution. One theme per iteration.                       |
| "Metrics look good, ignore qualitative."         | Faster ≠ better. Qualitative is primary.                         |
| "Reuse the same fresh agent."                    | It learned. Dispatch anew every time.                            |
| "Split every micro-edit into its own iteration." | Over-splitting. One semantic unit = one iteration.               |
| "Rewrite from scratch."                          | Valid only after 3+ stalled iterations.                          |

## Subagent troubleshooting

| Symptom                     | Cause                    | Fix                        |
| --------------------------- | ------------------------ | -------------------------- |
| "No API key found"          | Default model resolution | Specify `model` explicitly |
| Agent reads wrong files     | Skill/cwd pollution      | Add `skill: false`         |
| Parallel timeout (exit 143) | Cross-provider mixing    | Same-provider models only  |
| Subagent hangs              | Provider instability     | Try different model id     |

Structural-audit mode: for coherence/clarity checks only (not empirical behavior), mark the request with _"structural-audit mode: check textual coherence only, do not execute."_ Cannot count toward consecutive-clear convergence.
