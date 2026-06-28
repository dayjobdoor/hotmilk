---
name: recommend-research
description: Single entry for technology recommendations — judge scope, shortlist 3–5 candidates, verify with docs and source. Use when the user asks to compare libraries, evaluate stack choices, research OSS alternatives, pick dependencies, or needs evidence-backed technology advice. Triggers include recommend research, technology choice, library comparison, stack evaluation, OSS research, repo research, deepwiki, librarian, opensrc, brave-search.
---

# Recommend research

Single orchestration skill for **evidence-backed technology recommendations**.

## Scenario router (read first)

| User signal                                | Route                                                                       |
| ------------------------------------------ | --------------------------------------------------------------------------- |
| Stack / practice / cross-layer integration | **Holistic** — [`scope-gate.md`](references/scope-gate.md)                  |
| One library family or one category         | **Narrow** — [`scope-gate.md`](references/scope-gate.md)                    |
| User already named 1–2 candidates          | Skip shortlist survey; go to verify                                         |
| User wants internals / why / source proof  | Verify path → librarian or opensrc (see ladder)                             |
| Public GitHub repo docs / architecture     | deepwiki when available                                                     |
| First use / "show example"                 | [`example-narrow.md`](references/example-narrow.md) — read-only walkthrough |

**References:** Do **not** read `references/` unless a phase below applies. Each reference states its load trigger at the top.

## Phase map

```text
1. Scope           → scope-gate.md          (MANDATORY - READ ENTIRE FILE)
2. Shortlist       → shortlist-gate.md      (MANDATORY - READ ENTIRE FILE)
3. Verify          → verify-gate.md         (MANDATORY - READ ENTIRE FILE)
4. Recommend       → chat verdict (see below)
```

Skip phases that do not apply. Say which phase was skipped and why.

## Evidence tools (by job)

| Job                          | Tools                                            | Phase                                     |
| ---------------------------- | ------------------------------------------------ | ----------------------------------------- |
| **Discovery search**         | brave-search, web-search                         | Shortlist seed, verify pass 1–2           |
| **Repo / docs intelligence** | deepwiki, librarian                              | Verify pass 3–5                           |
| **Source access + search**   | opensrc + `rg`/`find` on `$(opensrc path <pkg>)` | Verify pass 4 only — not shortlist survey |

opensrc fetches cached source; it does **not** discover candidates. Use discovery search first; opensrc when finalists exist and internals matter.

## Skill resolution ladder

When a research skill is needed, resolve in order — stop at first hit. Announce which step forced a behavior change.

**Portable resolution:** If `/skill:` slash commands are unavailable, load the same capability from `<available_skills>` or `.atl/skill-registry.md` by path — keep this ladder order; do not swap opensrc before official docs for contract questions.

| Step | Skill                              | When                                                                            |
| ---- | ---------------------------------- | ------------------------------------------------------------------------------- |
| 1    | **deepwiki** (`/skill:deepwiki`)   | Public GitHub repo; architecture / how-it-works questions                       |
| 2    | **librarian** (`/skill:librarian`) | Implementation proof, permalinks, git history, issue/PR context                 |
| 3    | **opensrc** (`/skill:opensrc`)     | Finalist known; read or **search within** local source (`rg` on `opensrc path`) |
| 4    | **brave-search** or **web-search** | Current docs, surveys, release notes, fact-check                                |
| 5    | Project fallback                   | `./skills/` — load matching `SKILL.md` only when this flow is not enough        |

Path-specific notes:

- **Conceptual / API contract** → official docs first (verify-gate); deepwiki/librarian only when docs are thin or disputed
- **Internals / performance / edge cases** → librarian or opensrc before blog posts
- **Hotmilk planning after pick** → pioneer or tcz-agent-converge when integration is large or ambiguous (resolve via ladder step 5 if slash unavailable)

## Recommend output (Phase 4)

Emit a concise verdict only when verify-gate **done** criteria pass.

```markdown
## Recommendation

**Pick:** …
**Why:** … (cite docs or permalinks)
**Tradeoffs:** …
**Alternatives considered:** …
**Reversibility:** swap cost / migration note
**Evidence gaps:** … (if any — do not hide)
```

If evidence is insufficient, say what is missing and which verify step would close it — do not fake certainty.

## Anti-patterns

| Do not                                      | Why                                | Do instead                                               |
| ------------------------------------------- | ---------------------------------- | -------------------------------------------------------- |
| Read `references/` without a matching phase | Wastes tokens; wrong workflow      | Load only when scope, shortlist, or verify phase applies |
| Pick from GitHub stars alone                | Stars ≠ maintenance, security, fit | shortlist-gate criteria + verify-gate maintenance checks |
| Skip license check for production deps      | Legal / compliance risk            | verify-gate license row for every finalist               |
| Treat one blog post as API contract         | Drift from official docs           | Official docs first; blog as secondary signal only       |
| Clone every repo before reading docs        | Wastes time                        | Docs pass first; opensrc/librarian when internals matter |
| Recommend before verify **done**            | Plausible-but-wrong picks ship     | Finish verify-gate; list evidence gaps explicitly        |
| Shortlist >5 without user ask               | Review paralysis                   | Cap at 3–5; ask user to widen scope if needed            |
| Ignore archived / unmaintained repos        | Future breakage                    | verify-gate maintenance gate — drop or flag              |
| Use training-data memory for "latest"       | Stale version / API claims         | web-search or brave-search for current facts             |
| Holistic stack pick from one library doc    | Misses integration constraints     | scope-gate holistic path + verify-gate holistic table    |
| AGPL/SSPL in proprietary SaaS               | Compliance blockers                | verify-gate license row + deployment model               |
| Vendor SDK as only integration path         | Lock-in without exit               | Require exit path row; thin wrapper or second finalist   |
| Pre-1.0 semver for production               | Breaking API without pin strategy  | Flag risk; require changelog pass or user waiver         |

---

Read the **entire** reference for the active phase before shortlisting or recommending.
