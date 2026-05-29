---
name: empirical-prompt-tuning
description: "Harden prompts: fresh executor each iteration, checklist scoring, one themed delta per loop until convergence. After editing skills, AGENTS.md, CLAUDE.md, or task prompts. [Triggers: empirical prompt tuning, prompt evaluation, tune prompt, fresh agent evaluation]"
---

# Empirical Prompt Tuning

A prompt's quality is opaque to its author. **Dispatch a fresh agent, run the prompt, evaluate on two axes, iterate until plateau.** Do not stop before the plateau.

## Core Concept: Fresh Agent

Any executor with **no authoring context** and **no memory of prior iterations**. The implementation does not matter; the absence of authoring bias does. Self re-reading never qualifies.

### Dispatch Methods (pick one)

| Method                         | How                                                                                                                  | Notes                                                                             |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| **pi-subagents** (recommended) | `subagent({ agent: "assistant", task: "...", context: "fresh", model: "<model-id>", skill: false, clarify: false })` | Always set `context: "fresh"`, explicit `model`, `skill: false`, `clarify: false` |
| **Claude Code Task**           | `{ agent: "worker", task: "...", context: "fresh" }`                                                                 | Alternative when PI unavailable                                                   |
| **Separate session**           | New terminal: `claude` or `pi`                                                                                       | Manual but reliable                                                               |
| **Direct API**                 | POST to `/v1/messages` with empty history                                                                            | For programmatic testing                                                          |

**NOT fresh**: `context: "fork"` (inherits history), same session, self re-reading.

For parallel scenarios, use `subagent({ tasks: [...] })` with models from the **same provider** to avoid cross-provider timeouts.

## Workflow

```
0. Static coherence check (no dispatch)
1. Baseline: stakes tier + scenarios + requirement checklists
2. Dispatch fresh agent → execute → self-report
3. Two-sided evaluation (self-report + instructor metrics)
4. Apply ONE themed delta
5. New fresh agent → re-evaluate
6. Stop at 2 consecutive clears (or 3 for high-stakes)
```

### Step 0 — Static Coherence Check

Compare what the prompt **advertises** vs what the body **delivers**. Fix divergences before any dispatch.

| Target type                 | "Advertises" source          | Check                                       |
| --------------------------- | ---------------------------- | ------------------------------------------- |
| Skill file                  | Frontmatter `description`    | Triggers/use-cases match body coverage?     |
| CLAUDE.md section           | Section heading              | Heading promise matches actionable content? |
| Task prompt / system prompt | Opening instruction or title | Stated goal matches the actual rules?       |

Skipping this causes false positives — the fresh agent silently re-interprets the body.

### Step 1 — Baseline Preparation

**Choose and freeze a stakes tier** before anything else:

| Stakes                            | Scenarios             | `[critical]` tags | Stop condition       | Iteration cap |
| --------------------------------- | --------------------- | ----------------- | -------------------- | ------------- |
| **High** (core skill, automation) | 3 (1 median + 2 edge) | ≥ 2               | 3 consecutive clears | none          |
| **Standard** (default)            | 2 (1 median + 1 edge) | ≥ 1               | 2 consecutive clears | 5             |
| **Low** (small, low-blast)        | 2 (1 median + 1 edge) | ≥ 1               | ship at 80%          | 3             |

For each scenario, write a **requirement checklist** (3–7 items). Rules:

- At least one item tagged `[critical]` — without it, success judgment is vacuous.
- Fix the checklist before running. Do not adjust after seeing results.
- **Translating user complaints into checklist items**: If the user says "it produces shallow output", decompose "shallow" into observable, testable criteria (e.g., "identifies at least one concrete bug", "includes line references", "provides actionable suggestions"). Each criterion becomes a checklist item. The user's complaint itself is not a valid checklist item.
- `[critical]` means: if this item fails, the whole scenario fails (binary ×), regardless of other items.
- Non-critical items score: ○ = 1, partial = 0.5, × = 0. Accuracy = sum / total.

### Step 2–3 — Dispatch and Execute

Hand the fresh agent this contract:

```
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

**Always paste the full prompt** in the contract (not a file path) — ensures portability across all harness types.

### Step 4 — Two-Sided Evaluation

| Axis                    | Source               | How to measure                                                                                                                                                                                                                                                                                 |
| ----------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Success/Failure**     | Instructor           | ○ only if every `[critical]` met. Binary.                                                                                                                                                                                                                                                      |
| **Accuracy**            | Instructor           | ○/partial/× per item → percentage                                                                                                                                                                                                                                                              |
| **Step count**          | Environment metadata | `tool_uses` (Claude Code), tool-use blocks (API). For **text-generation targets** (no tool use): substitute with a concrete output-unit count — e.g., number of review comments, checklist items produced, or code blocks emitted. State the chosen unit once at the top of the iteration log. |
| **Duration**            | Environment metadata | `duration_ms` or wall-clock                                                                                                                                                                                                                                                                    |
| **Retry count**         | Self-report          | Times the agent redid a decision                                                                                                                                                                                                                                                               |
| **Ambiguities**         | Self-report          | Qualitative — primary signal for improvement                                                                                                                                                                                                                                                   |
| **Discretionary fills** | Self-report          | Surfaces implicit requirements                                                                                                                                                                                                                                                                 |

**Weighting**: Qualitative signals (ambiguities, fills) are primary. Quantitative metrics (time, steps) are supporting. Chasing time alone makes prompts brittle.

**On failure**: append one line to Ambiguities naming which `[critical]` item dropped.

#### Step Count as Structure Signal

Even at 100% accuracy, step-count skew across scenarios exposes structural flaws:

- One scenario at 3–5× the others → the prompt lacks self-containment for that case (executor wandered).
- Fix: add inline guidance or a minimal complete example.

### Step 5 — Apply ONE Delta

1. Identify the most impactful ambiguity.
2. **State which checklist item the edit satisfies** before editing — edits inferred from axis names alone rarely land.
3. Apply the minimum edit. One semantic theme per iteration. A cluster of 2–3 related micro-edits is one theme; unrelated edits go to the next iteration.

#### Correction Propagation Patterns

| Pattern            | What happens                                | Lesson                                                      |
| ------------------ | ------------------------------------------- | ----------------------------------------------------------- |
| Conservative drift | Edit aimed at multiple axes, only one moved | Multi-axis shots usually miss                               |
| Upside drift       | One structural edit satisfied multiple axes | Information combos are naturally multi-axis                 |
| Null drift         | Edit didn't move any axis                   | Axis names ≠ judgment text. Tie edits to threshold wording. |

### Step 6 — Re-evaluate

Dispatch a **new** fresh agent. Never reuse — it learned from the prior run. Repeat from Step 2.

### Step 7 — Stopping Criteria

**Converged** when for N consecutive iterations (N = 2 standard, 3 high-stakes):

- New ambiguities: 0
- Accuracy gain: ≤ +3 points
- Step count change: within ±10%
- Duration change: within ±15%

**At convergence** (all tiers): add one hold-out scenario not used in any prior iteration. If accuracy drops ≥ 15 points → overfitting. Return to scenario design. This is mandatory, not optional.

**Diverged**: after 3+ iterations ambiguities aren't decreasing → the prompt's design is wrong. Stop patching, rewrite.

**Resource cutoff**: ship at 80% when improvement cost exceeds prompt importance.

### Presentation Format

Record each iteration as:

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

- Never leave an axis blank (write "0", not "—").
- "None new" is explicit signal.
- Steps column may be replaced with turn count in plain-chat environments — note the substitution once.

## Red Flags

| Rationalization                                  | Reality                                                              |
| ------------------------------------------------ | -------------------------------------------------------------------- |
| "Re-reading it myself is equivalent."            | Structurally impossible to objectively view text you just wrote.     |
| "One scenario is enough."                        | Overfits. Minimum 2.                                                 |
| "Zero ambiguities once, so done."                | May be coincidence. Require consecutive clears.                      |
| "Fix multiple things in one pass."               | Lose attribution. One theme per iteration.                           |
| "Metrics look good, ignore qualitative."         | Faster ≠ better. Qualitative is primary.                             |
| "Reuse the same fresh agent."                    | It learned. Dispatch anew every time.                                |
| "Split every micro-edit into its own iteration." | Over-splitting. One semantic unit = one iteration.                   |
| "Rewrite from scratch."                          | Valid only after 3+ stalled iterations. Before that, it's an escape. |

## Environment Constraints

### When Fresh Agent Is Unavailable

This skill **requires** a fresh agent. Do not apply it when:

- Inside a subagent with no dispatch privileges
- `subagent` / Task tool is disabled
- No API key or rate-limited
- Cannot obtain fresh context through any method

### Fallback Order

1. Ask the user to open a separate session
2. Report: "empirical evaluation skipped: no fresh agent available"
3. **Never substitute self re-reading**

### Structural-Audit Mode

For coherence/clarity checks only (not empirical behavior): mark the request with _"structural-audit mode: check textual coherence only, do not execute."_ This is a supplement — it cannot count toward consecutive-clear convergence.

### pi-subagents Troubleshooting

| Symptom                     | Cause                    | Fix                        |
| --------------------------- | ------------------------ | -------------------------- |
| "No API key found"          | Default model resolution | Specify `model` explicitly |
| Agent reads wrong files     | Skill/cwd pollution      | Add `skill: false`         |
| Parallel timeout (exit 143) | Cross-provider mixing    | Same-provider models only  |
| Subagent hangs              | Provider instability     | Try different model id     |
