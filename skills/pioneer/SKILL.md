---
name: pioneer
description: End-to-end pioneer hotmilk workflow — graphify recon (phase 0), optional goal, grill-with-docs interview, chat Plan, Plannotator, planning-with-files, OpenSpec/SDD, autoresearch optimize loops, observational-memory for long sessions, shazam execute-time structure guards, then execute. Use for pioneer, architecture planning, bundled extension manifest work, hotmilk.json defaults, bundled-extensions.ts, /grill, /goal, /plannotator, /autoresearch, shazam_impact, graphify-out questions, openspec work, chat plan, compaction continuity, or before multi-step implementation.
---

# Pioneer (graph → goal → grill → plan → execute)

Single orchestration skill for **hotmilk** planning and execution.

## Scenario router (read first)

| User signal                                                     | Route                                                                                                                                                                     |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Turn-1 plan request, non-trivial scope                          | Phase 0 → Phase 3; skip grill unless one blocking term                                                                                                                    |
| One-file typo / known single-file fix                           | Chat Plan; skip Phase 0–2                                                                                                                                                 |
| Medium scope + human plan approval                              | Phase 0 → Plannotator (`extensions.plannotator: true`)                                                                                                                    |
| Heavy research, long session, `/clear` recovery                 | planning-with-files (`extensions.planning-with-files: true`)                                                                                                              |
| SDD request, cross-cutting, or medium+ bundled manifest work    | Phase 0 → OpenSpec (`gentle-ai` required) — see **Bundled extension scope**                                                                                               |
| Measure/optimize loop, benchmark regression, tune metric        | `/skill:autoresearch-create` (`extensions.autoresearch: true`); **not** a plan path — mutually exclusive with SDD/plan for same task                                      |
| Long session, frequent compactions, preserve decision rationale | `extensions.observational-memory: true` — background memory; **not** plan authority — see [`observational-memory-routing.md`](references/observational-memory-routing.md) |
| Shared-module edit, blast radius, post-edit LSP verify          | `extensions.shazam: true` — execute-time structure; **not** Phase 0 recon — see [`shazam-routing.md`](references/shazam-routing.md)                                       |
| Skill or prompt edit just completed                             | `/prompt-eval <path>` before ship                                                                                                                                         |

| Layer         | Delegate to                                                                    | Role                                                          |
| ------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| **Graph**     | `/skill:graphify`                                                              | Codebase map before broad search                              |
| **Structure** | pi-shazam (bundled, default off)                                               | Impact / verify during execute — not graph replacement        |
| **Goal**      | pi-goal (bundled, default off)                                                              | Multi-turn objective (optional)                               |
| **Grill**     | `/skill:grill-with-docs`                                                       | One question, CONTEXT/ADR, recommended answers                |
| **Plan**      | chat `Plan:` **or** Plannotator **or** planning-with-files **or** OpenSpec SDD | Light chat; approval gate; file memory; substantial spec work |
| **Execute**   | **`/skill:gentle-ai`** + subagents                                             | Implement, verify; SDD phases when active                     |

**References:** Do **not** read `references/` unless a phase below applies. Each reference states its load trigger at the top.

## Runtime

hotmilk bundles **graphify**, **gentle-ai** (default off), **pi-goal** (default off), **pi-subagents** (default off). Toggle via `/mode` + `/reload`. Verify commands: **`AGENTS.md`** (`bun run test`, `bun run check`).

| Toggle                            | Pioneer note                                                                                       |
| --------------------------------- | -------------------------------------------------------------------------------------------------- |
| `extensions.graphify`             | Phase 0; `graphify-out/` when built — off → graph-recon-gate fallback                              |
| `extensions.shazam`               | Phase 4 impact/verify (`shazam_*`); default off; complements graphify — not recon substitute       |
| `extensions.goal`                 | Phase 1; `/goal`, `get_goal`, `update_goal`                                                        |
| `extensions.gentle-ai`            | OpenSpec path; off → Chat Plan + direct execute only                                               |
| `extensions.ponytail`             | Lazy-senior output bias (default off); not a plan path                                             |
| `extensions.plannotator`          | Phase 3 approval gate; `/plannotator`, `--plan`; off → Chat Plan or OpenSpec                       |
| `extensions.planning-with-files`  | On-disk `task_plan` / `findings` / `progress`; off → skip file-memory path                         |
| `extensions.autoresearch`         | Optimize loop (`/autoresearch`, `.auto/`); off → one-shot Chat Plan + benchmark in `verify:`       |
| `extensions.context-mode`         | Prefer `ctx_*` for large outputs; pairs with observational-memory for long sessions                |
| `extensions.observational-memory` | Compaction continuity (observations/reflections); default off; not plan authority                  |
| `extensions.rtk-optimizer`        | Bash/read output compaction with context-mode                                                      |
| `extensions.subagents`            | Phase 4 delegation; off → inline execute                                                           |

**Skill dependencies** (`/skill:graphify`, `/skill:grill-with-docs`, `/skill:tdd`, `/skill:gentle-ai`) may live in bundled packages or global Pi config.

### Skill resolution ladder

When a `/skill:*` path is missing, resolve in order — stop at first hit. Announce which step forced a behavior change.

| Step | Check               | Action                                                                    |
| ---- | ------------------- | ------------------------------------------------------------------------- |
| 1    | Hotmilk first-party | Search `./skills/*/SKILL.md` for the same skill name                      |
| 2    | Bundled package     | Search `node_modules/*/skills/` and `.pi/skills/` for the same skill name |
| 3    | Global Pi config    | `$PI_CODING_AGENT_DIR/skills/`, `~/.claude/skills/`, `~/.agents/skills/`           |
| 4    | Project fallback    | `AGENTS.md` commands only; say which `/skill:*` was unavailable           |

Path-specific fallbacks when step 4 hits:

- **`/skill:gentle-ai`** + `extensions.gentle-ai: false` → Chat Plan + direct execute only (OpenSpec forbidden)
- **`/skill:graphify`** → [`graph-recon-gate.md`](references/graph-recon-gate.md) **Fallback when graph is missing**
- **`/skill:grill-with-docs`** → skip Phase 2; fix terms in Phase 3 **Assumptions**; one blocking chat question max

### Toggle-off ladder

When a capability is disabled via `/mode`, fall back — do not invoke missing tools or paths.

| Toggle off                               | Phase impact        | Fallback                                                                                           |
| ---------------------------------------- | ------------------- | -------------------------------------------------------------------------------------------------- |
| `extensions.graphify: false`             | Phase 0             | [`graph-recon-gate.md`](references/graph-recon-gate.md) **Fallback when graph is missing** ladder  |
| `extensions.goal: false`                 | Phase 1             | Skip `/goal`; objective in Assumptions or proposal — see [`goal-gate.md`](references/goal-gate.md) |
| `extensions.gentle-ai: false`            | OpenSpec path       | **Forbidden** — Chat Plan + direct execute only; say SDD requires gentle-ai                        |
| `extensions.plannotator: false`          | Plannotator path    | Chat Plan or OpenSpec per routing; say approval gate skipped                                       |
| `extensions.planning-with-files: false`  | File-memory path    | Skip PWF; use Chat Plan, Plannotator, or OpenSpec                                                  |
| `extensions.autoresearch: false`         | Optimize loop       | Chat Plan + explicit benchmark `verify:`; say autoresearch unavailable                             |
| `extensions.observational-memory: false` | Long-session memory | Say OM unavailable; use PWF for `/clear` recovery or context-mode for corpus                       |
| `extensions.shazam: false`               | Structure guards    | Say shazam unavailable; graphify + read/grep + tests in `verify:`                                  |
| `extensions.subagents: false`            | Phase 4             | Inline execute; no `subagent` tool — say delegation skipped                                        |
| grill-with-docs unavailable              | Phase 2             | Skip grill; terms in **Assumptions**; one blocking chat question max                               |

### Composite toggle-off matrix

When **multiple** toggles are off, apply rows in order — first matching row wins. Announce which composite row forced the path.

| Toggles off                            | Plan path        | Phase impact                                              | Fallback                                                                                                   |
| -------------------------------------- | ---------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `graphify` + `gentle-ai`               | Chat Plan only   | Phase 0 → graph-recon fallback ladder; OpenSpec forbidden | [`graph-recon-gate.md`](references/graph-recon-gate.md) **Fallback when graph is missing**; direct execute |
| `gentle-ai` + `subagents`              | Chat Plan only   | Phase 4 inline only; OpenSpec forbidden                   | No SDD; no `subagent` tool — say both skipped                                                              |
| `graphify` + `subagents`               | Either plan path | Phase 0 fallback; Phase 4 inline                          | Graph ladder + inline execute; say delegation skipped                                                      |
| `goal` + `graphify`                    | Either plan path | Skip Phase 1; Phase 0 fallback                            | Objective in Assumptions; graph-recon fallback ladder                                                      |
| `graphify` + `gentle-ai` + `subagents` | Chat Plan only   | Phase 0 fallback; Phase 4 inline                          | Graph ladder + inline execute; OpenSpec forbidden                                                          |

Say which toggle or missing skill forced the fallback when it changes the chosen path.

## Plan routing (one authority per task)

Choose **one** plan target per task:

| Path                    | When                                                                               | Artifact                                     | Reference                                                                                   |
| ----------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Chat Plan**           | Small, bounded, known context, single area, quick fix                              | `Plan:` in chat                              | [`references/chat-plan.md`](references/chat-plan.md)                                        |
| **Plannotator**         | Medium scope, human browser approval, bounded checklist execution                  | `plans/*.md` + approval                      | [`references/plannotator-routing.md`](references/plannotator-routing.md)                    |
| **planning-with-files** | Heavy research, parallel tracks, session recovery after `/clear`                   | `task_plan.md`, `findings.md`, `progress.md` | `/skill:planning-with-files` (bundled when toggled on)                                      |
| **OpenSpec SDD**        | Large, ambiguous, architectural, cross-cutting, high review risk, or user asks SDD | `openspec/changes/<change>/`                 | [`references/openspec-routing.md`](references/openspec-routing.md) + **`/skill:gentle-ai`** |

Say which path you chose and why. Do not mix plan authorities unless the user explicitly layers them (e.g. SDD tasks → Plannotator gate).

**Memory layers (not plan paths):** compaction rationale and session continuity → **`observational-memory`** when toggle on — see [`references/observational-memory-routing.md`](references/observational-memory-routing.md). Corpus / large output → **context-mode**. Execute-time structure (impact, LSP verify) → **`shazam`** when toggle on — see [`references/shazam-routing.md`](references/shazam-routing.md). Do not treat OM or shazam as spec or plan authority.

**Optimize loop (not a plan path):** when success = measurable metric with keep/discard iterations → **`/skill:autoresearch-create`** — see [`references/autoresearch-routing.md`](references/autoresearch-routing.md). Do not start Chat Plan, Plannotator, or OpenSpec for the same task unless the user pivots to feature delivery.

**Tie-breaker (gray zone):** scope is medium or ~2 files but not clearly trivial → **OpenSpec** when **any** of: cross-cutting, review budget >400 changed lines, 2+ areas/modules, architectural/product ambiguity, or **medium+ bundled manifest work** (new bundled row + dep + README + tests, or default toggle changes across `bundled-extensions.ts` and `hotmilk.json` — not a one-line typo). **Plannotator** when human approval is the primary goal and spec artifacts are not required. **planning-with-files** when research volume or `/clear` recovery dominates. Otherwise **Chat Plan**. If `extensions.gentle-ai: false`, OpenSpec is forbidden — Chat Plan or Plannotator only.

**MANDATORY - READ ENTIRE FILE** the reference for your chosen path before emitting `Plan:`, starting `/plannotator`, or starting SDD work.

### Bundled extension scope

When the task adds, removes, or reconfigures a bundled extension, resolve in Assumptions (chat) or proposal (SDD):

| Topic                    | Pin                                                                                                |
| ------------------------ | -------------------------------------------------------------------------------------------------- |
| Extension id             | kebab-case row in `src/config/bundled-extensions.ts` — **not** `package.json` → `pi.extensions`    |
| Edit scope               | Manifest row + `hotmilk.json` default + `package.json` dep + README; lazy load via `extensions.ts` |
| Auth / integration scope | OAuth, MCP, external API: state secrets, env, approval — default **no** new auth unless required   |
| Missing package          | Dependency install/version as explicit step; no speculative toggle defaults                        |

## Phase map

Skip phases that do not apply. Do not grill when graph + CONTEXT already answer the question.

**Plan on turn 1:** First message asks for a plan and scope is not trivial → Phase 3 after Phase 0; skip grill unless one blocking term remains.

```text
0. Graph recon          → **MANDATORY - READ ENTIRE FILE** graph-recon-gate.md
1. Goal (optional)      → **MANDATORY - READ ENTIRE FILE** goal-gate.md (when Phase 1 applies)
2. Grill (if unclear)   → /skill:grill-with-docs; one question/turn
   skip when graph+CONTEXT suffice or grill-with-docs unavailable
3. Plan                 → **MANDATORY - READ ENTIRE FILE** chat-plan.md OR plannotator-routing.md OR planning-with-files skill OR openspec-routing.md (+ gentle-ai for SDD)
4. Execute              → gentle-ai Work Routing Ladder (chat-plan Execute or SDD /sdd-continue)
   When shazam on      → shared-module edits: shazam_impact → edit → shazam_verify (+ tests)
   Alt: Optimize loop    → **MANDATORY - READ ENTIRE FILE** autoresearch-routing.md + `/skill:autoresearch-create` (replaces Phase 3–4 for metric loops)
5. Prompt hardening     → **MANDATORY - READ ENTIRE FILE** prompt-eval-gate.md (edits-only: before ship; mixed: after Phase 4)
```

---

## Anti-patterns

| Do not                                                 | Why                                                    | Do instead                                                                                                                                    |
| ------------------------------------------------------ | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Read `references/` without a matching path             | Wastes tokens; loads wrong workflow                    | Load only when Phase 0, Phase 1, Chat Plan, Plannotator, OpenSpec, autoresearch, observational-memory, shazam, or Phase 5 prompt-eval applies |
| Ship skill/prompt edits without prompt-eval            | Author blind spot; stale triggers survive              | Phase 5 → prompt-eval-gate → `/prompt-eval <path>`                                                                                            |
| Downgrade active SDD to Chat Plan mid-flow             | Artifact drift; verify/sync never run                  | Stop; tell user gentle-ai required; resume SDD after toggle on — see openspec-routing **Mid-flow recovery**                                   |
| OpenSpec when `gentle-ai` is off                       | SDD commands unavailable; path breaks mid-flow         | Chat Plan only; say toggle must enable gentle-ai for SDD                                                                                      |
| Ignore toggle-off ladder                               | Calls missing tools; false confidence in SDD/subagents | Use toggle-off table; announce fallback                                                                                                       |
| `Plan:` before scope stable (user did not ask)         | Premature plan hides glossary gaps                     | Keep grilling; user asks → Plan with open items in Assumptions                                                                                |
| OpenSpec for a one-file typo                           | SDD overhead wastes review budget                      | Chat Plan + direct implement                                                                                                                  |
| Chat Plan for cross-cutting architecture               | Chat plan lacks artifact gates                         | OpenSpec SDD + `/sdd-continue`                                                                                                                |
| Plannotator + OpenSpec as dual plan authorities        | Two sources of truth                                   | SDD for spec; Plannotator gates tasks or execution only                                                                                       |
| Plannotator + planning-with-files same plan file       | Schema and hook conflict                               | Separate paths: `plans/` vs `.planning/`                                                                                                      |
| Chat Plan mid-task then Plannotator for same scope     | Context split                                          | Pick one path at Phase 3                                                                                                                      |
| Autoresearch + SDD or Plannotator same task            | Conflicting authorities (loop vs gates)                | Pick autoresearch **or** plan path; `/autoresearch off` before switching                                                                      |
| OpenSpec or Plannotator mid-active autoresearch loop   | Metric loop never converges to shippable contract      | Stop loop; finalize or clear `.auto/`; then start plan path                                                                                   |
| Multiple grill questions in one message                | User cannot answer precisely; violates grill-with-docs | One question + recommended answer                                                                                                             |
| Grill without grill-with-docs loaded                   | Skill rules violated; multi-question drift             | Skip Phase 2 or load skill; terms in Assumptions                                                                                              |
| Broad grep ignoring `graphify-out/`                    | Misses graph-cached structure                          | Graph recon first (graph-recon-gate)                                                                                                          |
| `shazam_overview` instead of graphify for architecture | No persistent graph; wrong layer                       | Phase 0 graphify; shazam only in Phase 4 execute                                                                                              |
| Treat OM reflections as SDD spec                       | Hidden plan authority                                  | OpenSpec artifacts remain source of truth                                                                                                     |
| Invent graph edges or paths                            | False architecture confidence                          | `graphify query` / say "graph lacks …"                                                                                                        |
| Implementation detail in proposed CONTEXT              | CONTEXT is glossary/decisions, not design doc          | Glossary and decisions only                                                                                                                   |
| Skip SDD verify/sync                                   | Artifacts drift from shipped code                      | OpenSpec path → **`/skill:gentle-ai`** through archive                                                                                        |
| Ignore active `/goal`                                  | Session objective diverges from work                   | Read `get_goal`; update when done                                                                                                             |