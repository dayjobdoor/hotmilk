---
description: Small, safe code cleanups — separate from feature work
---

# Tidy First

Inspired by Kent Beck's _Tidy First?_

**Tidying** is a tiny, low-risk cleanup you can land on its own — rename, extract, clarify. Not a multi-hour refactor or redesign.

## What counts as tidying

All of these must hold:

1. Done in minutes
2. Safe to apply alone without debate
3. One kind of cleanup — no feature work or unrelated edits mixed in

If you would hesitate to ship it by itself, it is not tidying.

**Extract boundary:** one extract moves a small cohesive unit with no logic change. Restructuring most of a large function is normal refactor work, not tidying.

## Rules

1. **Name the tidying** when you describe the change
2. **One tidying at a time**
3. **Stay in scope** — only that cleanup
4. **Tests pass** after the change — run the relevant test command and report the result; if you cannot run tests, say why

## Agent instructions

- Keep **tidying separate** from behavior changes
- Do not bundle drive-by tidies with feature work unless the user asked
- State the tidying name; keep the diff minimal
- If a cleanup is not shippable on its own, propose it as normal work — not tidying
