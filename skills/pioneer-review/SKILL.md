---
name: pioneer-review
description: "Review a diff against its pioneer W table: every changed line traces to a requirement, every requirement to an observed check. Use for pioneer-review, \"does the diff match the W table\", when closing a pioneer change, 計画との差分レビュー. Not for generic PR, logic, or security review."
---

# Pioneer review

Input: the diff (`git diff <base>`) against the change base (the commit the
change started from; unsure: `git merge-base HEAD <default branch>`) and the
change's W table. No W table: rebuild R1… from the request and say so on the
first line. Observed check output comes from the change report or a check you
run yourself (lint, test); reading the diff is never a check.

## Tags

- `untraced:` changed line serving no R. Fix: drop it or name the R.
- `unverified:` R with no observed check output, whether or not it was reported passing. Fix: the check to run.
- `weakened:` test deleted, loosened, or skipped to pass. Fix: restore it; fix at the source level.
- `drift:` code, config, and docs disagree, including a pre-existing claim that a new line now contradicts. Name both sides and the owner doc.
- `unchanged:` something the table marked Unchanged moved. Fix: revert or reopen requirements.
- `split:` over ~400 changed lines or two unrelated Rs. Fix: the cut point.

## Format

`<file>:L<line>: <tag> <what>. <fix>.` Findings with no changed line (`split:`,
an R-level `unverified:`) use `diff: <tag> <R id or what> ...`. One finding per line, worst first: `weakened`, `unchanged`,
`unverified`, `drift`, `untraced`, `split`.

A refactor that edits a prior test is `weakened:` unless an R says the contract changed.

## Score

The last line is `trace: <traced>/<changed> lines, <N> R unverified.` Changed
lines: added + deleted lines in `git diff --numstat <base>` (binary `-` counts
0), plus every line of new untracked files; a line flagged `untraced:` is not
traced. Nothing found: `Traced. Ship.`, then the `trace:` line.

## Boundaries

Plan conformance only. Logic bugs and security: a normal review pass.
Lists findings, edits nothing. One-shot.
