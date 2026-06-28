# Verify gate (Phase 3)

**Load when:** Phase 3 runs — finalists exist and evidence-backed recommendation is next.

**Do NOT load when:** Scope not pinned (scope-gate). No finalists yet (shortlist-gate). User only asked for a link or doc lookup with no recommendation — use skill resolution ladder inline.

## Verify ladder (per finalist)

Run passes in order. Stop early when **done** criteria pass for the asked question depth.

| Pass | Source               | Skill / tool                                                                            | Proves                                                                                 |
| ---- | -------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 1    | Official docs        | fetch / web-search / brave-search                                                       | API contract, supported versions, install, license statement                           |
| 2    | Changelog / releases | same                                                                                    | Breaking changes, release cadence                                                      |
| 3    | Repository           | **`/skill:deepwiki`** or README                                                         | Architecture, scope, documented limits                                                 |
| 4    | Source / history     | **`/skill:librarian`** or **`/skill:opensrc`** + `rg`/`find` on `$(opensrc path <pkg>)` | Internals, edge cases, performance, "why" — source **search**, not candidate discovery |
| 5    | Issues / security    | librarian / gh / advisory DB                                                            | Open blockers, CVE status                                                              |

**Contract questions** → pass 1–2 often enough. **Internals / performance** → pass 4 required. Do not skip pass 1 because pass 4 is tempting.

## Holistic verify (cross-layer picks)

When scope-gate chose **Holistic**, run per-finalist passes **and** this integration table before Phase 4:

| Row                     | Check                                                       |
| ----------------------- | ----------------------------------------------------------- |
| API compatibility       | Shared types, auth tokens, error shapes across layers       |
| Shared auth / identity  | One login story; no duplicate secret stores                 |
| Deployment coupling     | Can layers deploy independently? Single rollback path?      |
| Data / schema alignment | Migrations, IDs, event contracts between components         |
| Ops surface             | One observability story; avoid N unrelated agents           |
| Rollback                | Partial failure — which layer reverts without orphan state? |

Holistic **done** requires at least one integrated stack story (not independent per-layer winners) with citations per layer.

## Per-finalist checklist

| Row         | Required for production pick                                  |
| ----------- | ------------------------------------------------------------- |
| License     | SPDX or README license — compatible with stated use           |
| Maintenance | Last release or commit within acceptable window for risk tier |
| API fit     | Maps to must-haves from scope-gate with doc citation          |
| Ops fit     | Install size, runtime deps, platform support                  |
| Exit path   | Migration or wrap cost if pick fails                          |

## Unavailable source fallbacks

| Situation                       | Fallback                                                              |
| ------------------------------- | --------------------------------------------------------------------- |
| Docs site down                  | Cached README, deepwiki, tagged release tree; say source is secondary |
| Private repo                    | Only public evidence; flag "cannot verify internals"                  |
| Archived project                | Recommend against unless user explicitly accepts unmaintained risk    |
| opensrc / librarian unavailable | Official docs + changelog only; widen **Evidence gaps** in verdict    |
| Conflicting blog vs docs        | **Docs win** unless source inspection proves blog correct             |

## Done criteria (Phase 3 complete)

Verify gate is **done** when:

1. Every **finalist** has pass 1 complete; passes 2–5 match question depth
2. At least one finalist has clear **pick** support with citations (doc URL or permalink)
3. Alternatives have explicit **why not** or tie-breaker
4. **Evidence gaps** listed — empty only when passes required for scope are satisfied

If done criteria fail, do **not** emit Phase 4 recommendation. State missing evidence and offer next verify step or user waiver.

## Handoff after verify

| Next user intent                  | Skill                                 |
| --------------------------------- | ------------------------------------- |
| Implement integration in hotmilk  | **`/skill:pioneer`**                  |
| Large multi-agent integration bet | **`/skill:tcz-agent-converge`**       |
| Prompt/skill edit from research   | **`/prompt-eval <path>`** before ship |
