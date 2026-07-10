# Observational memory (compaction continuity)

**Load when:** the session is **long**, compactions are frequent, and you need **why** decisions were made to survive summarization — not when you need a user-visible plan file or spec artifact.

**Do NOT load when:** planning-with-files, Plannotator, or OpenSpec SDD is the chosen plan authority — OM is **background session memory**, not plan truth.

**Canonical matrix:** [README § Workflow routing](../../../README.md#workflow-routing) (user-facing); this file is agent routing detail.

## When to use

| Signal                                                                  | Route here                                                        |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Multi-day refactor, deep debug, architecture exploration, migration arc | `extensions.observational-memory: true` after `/mode` + `/reload` |
| User asks why context was lost after compaction / “session feels reset” | Enable OM; start a **clean session** after V3 upgrade             |
| Large tool output already handled by context-mode                       | Keep **context-mode on**; add OM only for **decision rationale**  |
| User wants explicit on-disk plan + `/clear` recovery                    | **planning-with-files** — OM does not replace `task_plan.md`      |
| Human plan approval before writes                                       | **Plannotator** — OM is not an approval gate                      |
| Cross-cutting feature with proposal/spec/design                         | **OpenSpec SDD** — artifacts are contract; OM is supplementary    |

**Tie-breaker vs other memory layers:** corpus search / huge outputs → **context-mode** (`ctx_*`); readable plan files → **planning-with-files**; compaction-injected session rationale → **observational-memory**.

## 向く / 向かない (suited vs not suited)

Inspired by [Armin Ronacher — _The Coming Loop_](https://lucumr.pocoo.org/2026/6/23/the-coming-loop/) (2026-06-23): loops and compactions help when progress is measurable; they hurt when judgment and durable contracts are outsourced.

| 向く (use observational-memory)                             | Why                                               | 向かない (use another path)                 | Why                                                   |
| ----------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------- | ----------------------------------------------------- |
| Long session with repeated compactions                      | Observations + reflections inject before summary  | One-shot small fix                          | Overhead; Chat Plan + `verify:` is enough             |
| Preserve **why** a design choice was made across days       | Durable reflections distill rationale             | User-visible plan checklist                 | Use **Plannotator** or **planning-with-files**        |
| Deep debugging with rejected hypotheses to avoid reopening  | Observation timeline grounds the agent            | Feature spec / acceptance criteria          | Use **OpenSpec SDD**                                  |
| Pair with **pi-goal** for multi-turn arcs                   | OM captures tactical “why”; goal holds north-star | Same task also needs SDD proposal/spec      | SDD artifacts are authority; OM is supplementary only |
| Faster compaction (memory work incremental)                 | Upstream design goal for V3                       | `/clear` full session recovery              | Use **planning-with-files** on-disk files             |
| Engineer wants `recall` to trace observation/reflection IDs | Auditable session memory                          | Replace **context-mode** FTS5 for logs/docs | Different layer — use **ctx_search** / **ctx_index**  |

**Harness takeaway:** OM is **implicit session memory**. Return human judgment via plan paths (Plannotator / SDD) and PR review — do not treat reflections as spec or hidden plan authority.

## Prerequisites

| Requirement | Check                                                                                                         |
| ----------- | ------------------------------------------------------------------------------------------------------------- |
| Toggle      | `extensions.observational-memory: true` — if off, say compaction memory unavailable; do not fake `recall`     |
| Extension   | `pi-observational-memory` loaded via `/reload` after `/mode`                                                  |
| Pi version  | Targets Pi **0.74+** peers; hotmilk ships **0.80**                                                            |
| V3 upgrade  | V3 does **not** read V2 settings or memory — new clean session after upgrade                                  |
| Model cost  | Observer/reflector agents may call a separate model — configure in extension settings; default off in hotmilk |

## Coexistence matrix

| Layer                      | Tool / path                            | Relationship to OM                                            |
| -------------------------- | -------------------------------------- | ------------------------------------------------------------- |
| Large output / corpus      | **context-mode** (`ctx_*`)             | Complementary — OM ≠ indexed corpus                           |
| Shell output compaction    | **rtk-optimizer** + context-mode       | Complementary — orthogonal to session observations            |
| Codebase map               | **graphify**                           | Run Phase 0 recon; OM does not replace `graphify-out/`        |
| Session objective          | **pi-goal**                            | Goal = north-star; OM = tactical rationale                    |
| Plan authority             | PWF / Plannotator / SDD                | **One plan truth** — OM must not contradict chosen plan files |
| Persistent external memory | Engram / other packages (if installed) | Separate product — hotmilk does not bundle Engram by default  |

**Recommended stack (long coding session):** `context-mode: true` + `graphify` Phase 0 + optional `observational-memory: true` + one plan path when scope grows past chat.

## Workflow

```text
1. Confirm session will span compactions (not a one-file typo)
2. /mode → observational-memory ON → /reload
3. Work normally — observer/reflector run in background
4. On compaction, injected memory preserves decisions and rejected paths
5. Use recall tool when you need observation/reflection provenance
6. When scope needs spec or approval → pick plan path; do not let OM replace it
```

## Anti-patterns

| Do not                                              | Why                                     | Do instead                                        |
| --------------------------------------------------- | --------------------------------------- | ------------------------------------------------- |
| Treat reflections as OpenSpec / SDD substitute      | Hidden memory ≠ reviewable contract     | SDD artifacts + optional OM                       |
| OM + planning-with-files on same markdown plan file | Two writers on one “truth”              | PWF files vs OM session store — separate concerns |
| Default ON for all users                            | Extra model cost; V3 migration friction | hotmilk default **off**; enable for long sessions |
| Skip clean session after V2 → V3                    | Format mismatch; stale memory           | New session per upstream README                   |
| Disable context-mode and expect OM to index logs    | Wrong layer                             | `ctx_index` / `ctx_search` for corpus             |

## Fallback when toggle off

Say observational memory is unavailable. For compaction loss:

- Enable toggle and `/reload`, **or**
- Use **planning-with-files** for durable files, **or**
- Use **context-mode** to index key docs/logs, **or**
- Narrow scope to Chat Plan with explicit `verify:` checkpoints.

Upstream: [elpapi42/pi-observational-memory](https://github.com/elpapi42/pi-observational-memory) · npm `pi-observational-memory@3.x`
