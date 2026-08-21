# Autoresearch (optimize loop)

**Load when:** the task is a **measure → edit → benchmark → keep/discard** loop, not a one-shot feature or spec-driven build.

**Do NOT load when:** Chat Plan, Plannotator, planning-with-files, or OpenSpec SDD is the chosen plan authority — use the matching reference instead.

**Canonical matrix:** [README § Workflow routing](../../../README.md#workflow-routing).

## When to use

| Signal                                                                             | Route here                                                                            |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| User asks to optimize, benchmark, tune, or run experiments in a loop               | `/skill:autoresearch-create`                                                          |
| Success = measurable metric (test time, bundle size, loss, Lighthouse, build time) | Autoresearch                                                                          |
| User invokes `/autoresearch`, mentions `.auto/`, or wants keep/discard iterations  | Autoresearch                                                                          |
| Feature delivery, spec, architecture, cross-cutting change                         | OpenSpec / gentle-ai — **not** autoresearch                                           |
| Human plan approval before any writes                                              | Plannotator — **not** autoresearch as plan authority                                  |
| Strict RED→GREEN test-first for a known fix                                        | `/skill:tdd` or `/tdd` — **not** autoresearch unless optimizing the test suite itself |

**Tie-breaker vs plan paths:** optimization target with a metric → autoresearch; delivery with acceptance criteria and review gates → plan path (Chat / Plannotator / PWF / SDD).

## 向く / 向かない (suited vs not suited)

Inspired by [Armin Ronacher — _The Coming Loop_](https://lucumr.pocoo.org/2026/6/23/the-coming-loop/) (2026-06-23): agent loops excel when the harness can **measure** progress; they degrade long-lived code when judgment is outsourced to the loop alone.

| 向く (use autoresearch)                                                      | Why                                               | 向かない (use another path)                      | Why                                                                      |
| ---------------------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------ |
| Metric optimization (build time, bundle size, benchmark score, test runtime) | Machine-verifiable keep/discard signal            | Feature delivery with acceptance criteria        | Needs spec, review gates, human product judgment → **SDD / Plannotator** |
| Mechanical transforms (port, migration, bulk rename) with binary pass/fail   | Clear invariant; loop replaces tedious repetition | Cross-cutting architecture or manifest work      | Many files + contract risk → **OpenSpec SDD**                            |
| Experiment exploration (hyperparams, perf knobs, algorithm variants)         | Short-lived tries; best branch wins               | Long-lived production module, hands-off for days | Defensive layers stack; comprehension drops → **SDD + phased apply**     |
| Security scan / dependency triage loops                                      | Verifiable findings; bounded artifact             | “Make it work” without a measure command         | No metric → **Chat Plan** with explicit `verify:` or **TDD**             |
| Research / PoC where discard is cheap                                        | `.auto/` and branches are disposable              | Production bugfix with one known root cause      | Single shot + tests → **TDD** or inline fix                              |
| Optimizing the test suite or CI itself                                       | Metric = test time, flake rate, coverage gate     | Same task also needs proposal/spec/design        | Dual authority → pick **SDD** _or_ autoresearch, not both                |

**Harness takeaway:** autoresearch is the **outer optimize loop** (queue → measure → keep/revert). Pair with graphify recon before starting; return human judgment via **finalize** + PR review — do not treat the loop as “done” without a human or phase gate on merge.

## Prerequisites

| Requirement | Check                                                                                                                 |
| ----------- | --------------------------------------------------------------------------------------------------------------------- |
| Toggle      | `extensions.autoresearch: true` — if off, say loop unavailable; do not fake the workflow                              |
| Extension   | `pi-autoresearch` loaded via `/reload` after `/mode`                                                                  |
| Skills      | `autoresearch-create` (start), `autoresearch-finalize` (clean branches), `autoresearch-hooks` (optional side effects) |
| Workspace   | Writes under `.auto/` (`prompt.md`, `log.jsonl`, session state) — add `.auto/` to `.gitignore` if missing             |

## Workflow

```text
1. Confirm metric, direction (lower/higher), and measure command
2. /skill:autoresearch-create → init_experiment + session files
3. Loop: propose change → run_experiment → log_experiment (keep or revert)
4. /autoresearch export for live dashboard (optional)
5. When done: /skill:autoresearch-finalize for reviewable branches
```

## Coexistence matrix

| Layer                       | Autoresearch                             | Notes                                                                                                                             |
| --------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **gentle-ai SDD**           | **Mutually exclusive** for the same task | SDD = phased spec/apply/verify; autoresearch = unbounded optimize loop. Pick one authority.                                       |
| **gentle-ai inline/worker** | OK after loop                            | Use subagents for isolated tries; do not run SDD phases mid-loop                                                                  |
| **Plannotator**             | **Do not combine** as dual authority     | Approve a plan, then autoresearch only if metric loop is a separate follow-up task                                                |
| **planning-with-files**     | Rare overlap                             | PWF for research notes; autoresearch for benchmark loop — separate dirs (`.planning/` vs `.auto/`)                                |
| **red-green / TDD**         | Different jobs                           | TDD = correctness-first test cycle; autoresearch = metric optimization. Use TDD inside a loop only when the metric is test-driven |
| **pi-goal**                 | OK                                       | Goal = north star; autoresearch = tactical iterations toward metric                                                               |
| **graphify**                | OK before loop                           | Phase 0 recon still applies when codebase map reduces bad experiments                                                             |

## Execute (vs Phase 4)

Autoresearch **replaces** pioneer Phase 3–4 when the task is optimize-only:

```text
Phase 0 graph (optional) → autoresearch-create → loop until metric plateaus or user stops
```

Do **not** emit `Plan:` or start SDD for the same scope unless the user pivots to feature delivery.

## gentle-ai guardrails

When `extensions.gentle-ai: true` and autoresearch is active:

- Do not start `/sdd-continue` or OpenSpec apply for the same change name.
- Prefer **inline or worker** execution inside the loop; avoid review-budget gates every iteration.
- Turn autoresearch **off** (`/autoresearch off`) before switching to SDD or Plannotator on the same task.

## Shortcuts and UI

Default shortcut: `Ctrl+Shift+F` (fullscreen dashboard). Override in `$PI_CODING_AGENT_DIR/extensions/pi-autoresearch.json`:

```json
{
  "shortcuts": {
    "fullscreenDashboard": "ctrl+shift+y"
  }
}
```

Use `null` to disable a shortcut. Off by default in hotmilk — widget + shortcuts add session weight.

## Fallback when autoresearch is off

- Say **"Autoresearch skipped: extension off"**
- One-shot optimize → Chat Plan with explicit `verify:` benchmark commands
- Feature + metric → OpenSpec or Plannotator first; enable autoresearch only for a follow-up optimization slice

## Anti-patterns

| Do not                                        | Do instead                                           |
| --------------------------------------------- | ---------------------------------------------------- |
| SDD proposal + autoresearch loop same task    | Pick SDD **or** autoresearch                         |
| Plannotator plan + `/autoresearch` same scope | Finish approval path; start autoresearch as new task |
| Autoresearch without a defined metric         | `init_experiment` with measure command first         |
| Leave autoresearch on during manual SDD apply | `/autoresearch off` before phase work                |
| Ignore `.auto/log.jsonl` growth               | `/autoresearch clear` or finalize when pivoting      |
