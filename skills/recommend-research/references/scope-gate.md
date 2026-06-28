# Scope gate (Phase 1)

**Load when:** Phase 1 runs — before shortlist or verify. User intent for technology choice is present but track is not yet pinned.

**Do NOT load when:** User already committed to holistic vs narrow in chat; skip to shortlist-gate or verify-gate. User only wants internals of a named library — load verify-gate directly.

## Decision tree

| Signal                                                          | Track                    | Examples                                                                      |
| --------------------------------------------------------------- | ------------------------ | ----------------------------------------------------------------------------- |
| Multiple moving parts, stack, practice, cross-layer integration | **Holistic**             | "Auth for Workers + D1 + frontend", "observability stack", "monorepo tooling" |
| One category or one library family                              | **Narrow**               | "Rust HTTP client", "Zod vs Valibot", "test runner for this repo"             |
| User named exactly one candidate                                | **Narrow (verify-only)** | Skip shortlist-gate; verify that candidate + one obvious alternative          |

Say which track you chose and why in one sentence.

## Holistic checklist

Before shortlisting, pin:

| Topic                | Question                                                |
| -------------------- | ------------------------------------------------------- |
| Decision owner       | Who lives with this choice in 6 months?                 |
| Reversibility        | Swap cost — migration, API surface, team skill?         |
| Evidence bar         | What would falsify the leading option?                  |
| Constraints          | Runtime, license, hosting, team language, existing deps |
| Integration surfaces | Which layers/modules must agree?                        |

Holistic scope → shortlist **per layer or concern**, not one flat list of unrelated libraries.

## Narrow checklist

| Topic               | Question                                                |
| ------------------- | ------------------------------------------------------- |
| Category boundary   | What is in / out of scope for this pick?                |
| Must-haves          | Hard requirements (license, protocol, size, sync/async) |
| Nice-to-haves       | Tie-breakers only — not gate zero                       |
| Default alternative | Name the incumbent or "do nothing" baseline             |

## Stop / escalate

| Condition                                      | Action                                                                                         |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Requirements contradictory                     | One clarifying question; do not shortlist yet                                                  |
| Pick is product/business not technical         | Say so; ask for product constraints before research                                            |
| Scope spans hotmilk bundled extension manifest | Note `pioneer` bundled-extension pins; hand off after recommendation if implementation follows |
