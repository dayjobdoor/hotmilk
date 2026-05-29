---
name: pioneer
description: End-to-end pion workflow — graphify recon, optional goal, grill-with-docs interview, structured Plan, then execute. Use for architecture planning, /grill, /goal, graphify-out questions, or before multi-step implementation.
---

# Pioneer (graph → goal → grill → plan → execute)

Single orchestration skill for **pion** read-only planning and execution. It combines:

| Layer       | Source                                    | Role                                                                |
| ----------- | ----------------------------------------- | ------------------------------------------------------------------- |
| **Graph**   | `/skill:graphify` (bundled `graphify-pi`) | Codebase map before broad search                                    |
| **Goal**    | pion `/goal`, `get_goal`, `update_goal`   | Multi-turn objective (optional)                                     |
| **Grill**   | `/skill:grill-with-docs`                  | One question, CONTEXT/ADR, recommended answers                      |
| **Plan**    | pion `Plan:` + `[DONE:n]`                 | Structured steps with verification                                  |
| **Execute** | `/pion-execute`                           | Writes + doc proposals; `/skill:tdd-guard` + `/skill:tdd` for tests |

Load this skill when the user plans work in pion, asks how modules relate, or runs `/grill` / `/pion-grill` / `/goal` in the same session.

## Phase map

```text
0. Graph recon (if graphify-out exists)     — read-only
1. Goal (optional)                          — /goal when work spans many turns
2. Grill (when scope/terms unclear)         — /pion-grill or /grill <task>
3. Plan                                     — Context / Assumptions / Tradeoffs / Risks + Plan:
4. Execute                                  — /pion-execute, [DONE:n], apply Proposed docs
```

Skip phases that do not apply. Do not grill when the graph + CONTEXT already answer the question.

---

## Phase 0 — Graph recon (graphify)

**Before** wide `grep` / reading many files, check graph artifacts in the project cwd:

1. `graphify-out/wiki/index.md` — prefer for navigation when sufficient
2. `graphify-out/GRAPH_REPORT.md` — god nodes, surprising connections, suggested questions
3. `graphify-out/graph.json` — fallback for paths and communities

**When to use graph commands** (see `/skill:graphify` for full CLI):

| Question type            | Command                                                 |
| ------------------------ | ------------------------------------------------------- |
| How does X relate to Y?  | `graphify query "…" --graph graphify-out/graph.json`    |
| Shortest dependency path | `graphify path "A" "B" --graph graphify-out/graph.json` |
| What is node X?          | `graphify explain "X" --graph graphify-out/graph.json`  |

Rules:

- Answer from graph output; do not invent edges or source paths.
- If the graph gives an exact path, use it; otherwise one narrow lookup, then read that file.
- If `graphify-out/needs_update` exists or code changed this session, say the graph may be stale; suggest `graphify update .` before trusting modified areas.
- No `graphify-out/`? Skip this phase or offer a build (`graphify .`) only if the user wants a map.

Use graph **suggested questions** to seed grill topics (cross-community bridges).

---

## Phase 1 — Goal (optional)

Use when the task is not a single plan but a **session-long objective** (feature, migration, investigation).

| Action                  | Command / tool                                                                           |
| ----------------------- | ---------------------------------------------------------------------------------------- |
| Set objective           | `/goal <text>` or `update_goal`                                                          |
| Check progress          | `get_goal`                                                                               |
| Pause during plan/grill | automatic — pion suppresses `agent_end` auto-continue while plan/grill/execute is active |
| Resume after plan work  | `/goal resume`                                                                           |

Align the goal text with what the grill and `Plan:` will deliver. After `/pion-execute`, mark goal progress in `update_goal` when milestones complete.

---

## Phase 2 — Grill (grill-with-docs)

Enter when terminology, scope, or trade-offs are unclear — even after graph recon.

**Start:** `/pion-grill`, `/grill <task>`, or `/pion` + load `/skill:grill-with-docs`.

**Strict rules** (details in grill-with-docs skill):

- **One question per turn** + **recommended answer**; wait for the user.
- Recon: `CONTEXT-MAP.md` when present, then the relevant `CONTEXT.md`; ADRs under `docs/adr/` and `extensions/pion/docs/adr/` (formats in `skills/grill-with-docs/references/`).
- Cross-check user claims against code; sharpen vague terms against the glossary.
- Read-only: emit `## Proposed CONTEXT.md` / `## Proposed ADR` in chat — no `edit`/`write`.
- Do **not** output `Plan:` until grilling is done or the user asks (e.g. "プラン出して").

**Graph + grill:** Use GRAPH_REPORT god nodes / surprising connections as grill fuel ("this edge implies X — is that still true?").

---

## Phase 3 — Plan

Emit only when grill is sufficient or the user requests a plan.

### Required shape

```markdown
## Context

## Assumptions

## Tradeoffs

## Risks

Plan:

1. … — verify: …
2. …
```

### Step ordering

1. Apply any `## Proposed CONTEXT.md` / `## Proposed ADR` from grill (or reference them as first steps).
2. Recon / design steps informed by graph paths and communities.
3. Implementation steps with concrete `verify:` checks (test, command, file exists, behavior).

### Persist plan file (chezmoi / multi-context repos)

When the chezmoi repo (or any project with `CONTEXT-MAP.md`) is the cwd:

- At **plan finalization**, write **`docs/plans/<slug>.md`** with the same `## Context` … `Plan:` content (kebab-case slug).
- Chat `Plan:` remains the pion step tracker (`[DONE:n]` after `/pion-execute`).
- Only `docs/plans/*.md` may be written while plan mode is ON; CONTEXT / ADR / code wait for `/pion-execute`.

While pion is ON: **no** `edit`; **no** `write` except `docs/plans/<slug>.md` at finalize. Refine with `/pion-refine`.

---

## Phase 4 — Execute

**Start:** `/pion-execute` (restores write tools; may enable `get_goal` / `update_goal` in tool set).

- Work steps in order; tag completed steps with `[DONE:n]` in the response.
- Sync CONTEXT/ADR and **doc patches** from grill (bootstrap or drift fixes) before code when proposed.
- For test work: load **`/skill:tdd`** then **`/skill:tdd-guard`** (plan testlist if missing, then one cycle at a time).
- After large code changes, mention `graphify update .` if the project uses graphify.
- Interrupt: `/pion-interrupt` (steer). Stop: `/pion-stop` (abort, exit execute mode).
- Unfinished steps: `/pion-todos`.

---

## Commands (quick reference)

| Command                                | Phase                                            |
| -------------------------------------- | ------------------------------------------------ |
| `/pion`                                | Toggle plan mode (read-only)                     |
| `/pion-grill`, `/grill <task>`         | Grill only                                       |
| `/pion-refine`                         | Adjust plan (read-only)                          |
| `/pion-execute`                        | Execute                                          |
| `/pion-stop`, `/pion-interrupt`        | Control during execute                           |
| `/pion-todos`                          | Remaining plan steps                             |
| `/goal`, `/goal pause`, `/goal resume` | Goal                                             |
| `/graphify …`                          | Delegates to graphify skill (build/query/update) |

## Anti-patterns

| Do not                                                      | Do instead                                                 |
| ----------------------------------------------------------- | ---------------------------------------------------------- |
| `Plan:` before glossary/scope stable                        | Keep grilling                                              |
| Multiple grill questions in one message                     | One question + recommended answer                          |
| Broad grep ignoring `graphify-out/`                         | Graph recon first                                          |
| Invent graph edges or paths                                 | `graphify query` / say "graph lacks …"                     |
| Implementation detail in proposed CONTEXT                   | Glossary and decisions only                                |
| `edit` or `write` outside `docs/plans/` while plan/grill ON | `/pion-execute` (plan file at finalize is OK in plan mode) |
| Ignore active `/goal`                                       | Read `get_goal`; update when done                          |

## Related skills

- **`/skill:grill-with-docs`** — grill + doc bootstrap/sync (replaces make-docs / update-docs)
- **`/skill:tdd`** — canonical TDD philosophy (load first)
- **`/skill:tdd-guard`** — test planning + cycle guardrails (replaces tdd-cycle / testcase)
- **`/skill:graphify`** — build, update, query, MCP, watch, merge graphs
