# Shortlist gate (Phase 2)

**Load when:** Phase 2 runs — scope track is pinned and finalists are not yet chosen.

**Do NOT load when:** User supplied a final candidate list (≤5) and asked for verify only. Holistic scope not yet pinned — load scope-gate first.

## Target size

| Rule        | Detail                            |
| ----------- | --------------------------------- |
| Default cap | **3–5** finalists                 |
| Minimum     | 2 when a comparison was requested |
| Widen       | Ask user before exceeding 5       |

Cut aggressively. Surveys seed options; they do not replace verify.

## Seed sources (fast pass)

Use curated surveys and comparisons to seed — then drop weak fits before verify spends tokens.

| Source type                                 | Use for                                                                                                                  |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Official "comparison" / "alternatives" docs | Category leaders                                                                                                         |
| Trusted survey posts (dated)                | Breadth — always date-check                                                                                              |
| Repo README "similar projects"              | Maintainer view                                                                                                          |
| Existing project deps / lockfiles           | Incumbent and neighbors — names only; use opensrc in verify pass 4 to read/search those deps, not to seed new categories |

**Do not** treat seed sources as evidence. They only populate the shortlist.

## Cut criteria (apply before verify)

Drop a candidate when **any** hard fail:

| Gate        | Fail signal                                                         |
| ----------- | ------------------------------------------------------------------- |
| Maintenance | Archived, no release >18mo, bus factor 1 with no activity           |
| License     | Incompatible with stated deployment (GPL in proprietary SaaS, etc.) |
| Constraint  | Violates must-have from scope-gate (runtime, protocol, size)        |
| Fit         | Solves adjacent problem, not the asked category                     |
| Risk        | Unresolved security advisory without fix path                       |

Keep a **dropped** note (one line each) for transparency when user may ask "why not X?".

## Empty shortlist recovery

When **every** candidate fails cut criteria:

| Step | Action                                                                         |
| ---- | ------------------------------------------------------------------------------ |
| 1    | List hard fails per dropped option (one line each)                             |
| 2    | Ask user to relax one must-have, widen category, or accept higher risk tier    |
| 3    | Re-seed with broader survey pass — do not verify until ≥2 finalists remain     |
| 4    | If still empty → stop; no Phase 4 verdict. State constraints vs market reality |

## Thinking before cut

Ask internally (or one user question if blocking):

- **Reversibility:** Is this a experiment-friendly pick or a multi-year bet?
- **Evidence bar:** What single fact would eliminate each finalist?
- **Incumbent:** Is "keep current dep / stdlib / no new dep" on the list?

## Done → Phase 3

Shortlist gate is **done** when:

1. 3–5 finalists (or 2 for strict either-or) listed with one-line rationale each
2. Dropped notable options summarized if user named them
3. Next step declared: verify-gate per finalist
