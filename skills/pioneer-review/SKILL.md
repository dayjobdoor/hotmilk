---
name: pioneer-review
description: Review a diff against its pioneer W table, not as its author. Every changed line must trace to a requirement, every requirement to an observed check, and code, config, and docs must agree. One line per finding. Use for pioneer-review, "review this change against the plan", "does the diff match the W table", before closing a pioneer change, or before opening a PR. One-shot report, applies nothing.
---

# Pioneer review

The diff's best outcome: every line traces, every R is observed, nothing drifts.
Input: the diff (`git diff` against the change base) and the change's W table.
No W table: rebuild R1… from the request and say so on the first line.

## Tags

- `untraced:` changed line serving no R. Fix: drop it or name the R.
- `unverified:` R with no observed check output (a command run and its result), whether or not it was reported passing. Reading the diff is not a check. Fix: the check to run.
- `weakened:` test deleted, loosened, or skipped to pass. Fix: restore it; fix at the source level.
- `drift:` code, config, and docs disagree, including a pre-existing claim that a new line now contradicts. Name both sides and the owner doc.
- `unchanged:` something the table marked Unchanged moved. Fix: revert or reopen requirements.
- `split:` over ~400 changed lines or two unrelated Rs. Fix: the cut point.

## Format

`<file>:L<line>: <tag> <what>. <fix>.` Whole-diff findings (`split:`) use
`diff: <tag> ...`. One finding per line, worst first: `weakened`, `unchanged`,
`unverified`, `drift`, `untraced`, `split`.

A refactor preserves behavior: prior tests pass unchanged. A refactor that
edits a prior test is `weakened:` unless an R says the contract changed.

## Score

End with `trace: <traced>/<changed> lines, <N> R unverified.` Changed lines:
added + deleted lines in `git diff --numstat` against the change base, plus
every line of new untracked files; a line flagged `untraced:` is not traced.
Nothing found: `Traced. Ship.`

## Boundaries

Plan conformance only. Logic bugs and security: a normal review pass.
Over-engineering: `ponytail-review`. Lists findings, edits nothing. One-shot.
