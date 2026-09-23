---
name: hotmilk
description: Pi TUI surfaces for the hotmilk meta-package; colors resolve through the active Pi theme.
omitted: [typography, spacing, rounded]
colors:
  primary: "#E8E8E3"
  accent: "#F92772"
  dim: "#8b8674"
components:
  footer-core:
    textColor: "{colors.primary}"
  footer-status:
    textColor: "{colors.dim}"
  mode-title:
    textColor: "{colors.accent}"
---

# Design

What is seen and operated in the Pi TUI. State, startup, and load order live in [docs/architecture.md](docs/architecture.md).

Implementation: [src/ui/footer.ts](src/ui/footer.ts), [src/controller/mode.ts](src/controller/mode.ts), [src/controller/input.ts](src/controller/input.ts), [src/bootstrap/session.ts](src/bootstrap/session.ts), [src/bootstrap/project-trust.ts](src/bootstrap/project-trust.ts), [src/bootstrap/defaults.ts](src/bootstrap/defaults.ts), [package.json](package.json) `pi.image`.

## Overview

hotmilk adds four surfaces to the Pi TUI: a footer wrapper, a custom `/mode` modal, a project-trust prompt, and notify wiring. It ships no custom fonts, borders, or spacing; geometry stays in Pi's components.

- Normative color source: [themes/monokai.json](themes/monokai.json). The front-matter tokens are the roles hotmilk consumes; on conflict the theme file wins.
- Package image: [`assets/image.jpeg`](assets/image.jpeg), published as `pi.image` (GitHub raw URL in `package.json`). No other mark is defined in this repo.

## Colors

| Token    | Value     | Use                                                        |
| -------- | --------- | ---------------------------------------------------------- |
| primary  | `#E8E8E3` | Footer working-directory and stats lines (Pi default text) |
| accent   | `#F92772` | `/mode` title, bold (monokai `purple`)                     |
| dim      | `#8b8674` | Extension status lines, clock metadata (monokai `comment`) |

Notify levels `info` / `warning` / `error` are passed through from hotmilk; Pi maps each level through the active theme (monokai defines `warning` as `#FD9720` orange and `error` as `#E73C50` red). No custom colors exist in hotmilk code.

## Layout

Footer is installed on `session_start` via `setupHotmilkFooter`. It is skipped when `ctx.hasUI` is false.

From top to bottom:

1. Pi `FooterComponent` working-directory line
2. Stats line (model, thinking level, context usage)
3. Extension status lines: dim, width-truncated, sorted by extension id, newlines stripped
4. Clock (`HH:mm:ss`) and `TERM_PROGRAM` (or `none`) appended to the last line when they fit, otherwise as a new dim line

Clock refreshes every 30 seconds. Empty lines are dropped.

`extensions.kanagawa: true` replaces this footer. Session start warns and tells the operator to turn kanagawa off in `/mode` to restore it. gentle-pi `startup-banner` is not in the bundled registry and is not loaded.

## Components

### Mode modal

`/mode` opens a custom TUI modal (`ctx.ui.custom`):

- Title: `Mode settings`, theme `accent`, bold
- Body: `SettingsList` with search, height `min(items + 2, 15)`
- First group: `Defaults` → `persona` (`gentleman` / `neutral` / `gyal` / `raiden`)
- Later groups: labels from `BUNDLED_EXTENSION_GROUP_ORDER` (`Harness`, `Agent tools`, `Context & performance`, `Integrations`, `Workflow`, `Output`, `Experiments`); each bundled id is `on` or `off`
- Group header rows are not editable
- Closing the list dismisses the modal
- After close: info notify with config path and current toggles, then "Run /reload to apply"

### Status commands

Commands that notify without a modal:

- `/stop`: warning if work was aborted, info if idle
- `/interrupt <prompt>`: warning if the prompt is missing, info when sent

### Trust prompt

When `projectTrust.mode` is `prompt` and UI exists, `ctx.ui.confirm` asks `Trust project` with the project cwd and what trust enables. No UI → `undecided`.

## Do's and Don'ts

- Do: map every color through the active theme.
- Don't: hardcode colors in hotmilk code.
- Don't: add a second footer or load gentle-pi's `startup-banner`.
- Don't: render the footer when `ctx.hasUI` is false.
- Do: keep `/mode` groups aligned with the single bundled-extension registry.
