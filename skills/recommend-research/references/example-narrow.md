# Example: narrow track (reference walkthrough)

**Load when:** First use of this skill, or user asks for an example / how the flow works.

**Do NOT load when:** Active phase work is underway — follow scope → shortlist → verify instead.

## Scenario

User: "Rust HTTP client for this service — reqwest vs ureq vs hyper?"

## Phase 1 — Scope (scope-gate)

- Track: **Narrow** — one library family (HTTP client).
- Must-haves: async, TLS, JSON body helpers, MIT/Apache OK.
- Incumbent baseline: stdlib only (manual `TcpStream` + hand-rolled HTTP).
- One-line pin: "Pick async Rust HTTP client for outbound JSON APIs; TLS required."

## Phase 2 — Shortlist (shortlist-gate)

| Finalist | One-line rationale                                          |
| -------- | ----------------------------------------------------------- |
| reqwest  | Ecosystem default; async + TLS + JSON ergonomics            |
| ureq     | Sync-only; drop if async is hard must-have                  |
| hyper    | Low-level; keep if user needs control over middleware stack |

Dropped: ureq — violates async must-have.

If all candidates fail cut criteria → relax one must-have with user, widen category, or stop with "no evidence-backed pick."

## Phase 3 — Verify (verify-gate)

Per finalist (reqwest, hyper):

1. **Pass 1** — Official docs: async API, TLS feature flags, MSRV, license.
2. **Pass 2** — Changelog: recent release cadence, breaking changes in last 12mo.
3. **Pass 4** (if performance questioned) — opensrc on hot path or librarian for issue history.

Evidence gaps: none if pass 1–2 satisfy must-haves.

## Phase 4 — Recommend (SKILL.md template)

```markdown
## Recommendation

**Pick:** reqwest
**Why:** Official async + TLS docs match must-haves; active releases (cite doc URL)
**Tradeoffs:** Heavier deps than hyper; less control than raw hyper stack
**Alternatives considered:** hyper — more control, more boilerplate; ureq dropped (sync-only)
**Reversibility:** Medium — HTTP client swap touches call sites and middleware
**Evidence gaps:** (none)
```

Skill resolution during verify: web-search/brave-search for docs (step 4); opensrc only if user asks about connection pooling internals.
