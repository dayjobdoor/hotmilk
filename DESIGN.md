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

Implementation: [src/ui/footer.ts](src/ui/footer.ts), [src/ui/logo.ts](src/ui/logo.ts), [src/controller/mode.ts](src/controller/mode.ts), [src/controller/input.ts](src/controller/input.ts), [src/bootstrap/session.ts](src/bootstrap/session.ts), [src/bootstrap/project-trust.ts](src/bootstrap/project-trust.ts), [src/bootstrap/defaults.ts](src/bootstrap/defaults.ts), [package.json](package.json) `pi.image`. Web surface design (header, paging, styling) is also managed in this file (see the Web surface section).

## Overview

hotmilk adds four surfaces to the Pi TUI: a startup intro animation, a footer wrapper, a custom `/mode` modal, a project-trust prompt, and notify wiring. It ships no custom fonts, borders, or spacing — geometry stays in Pi's components.

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

Under omp, `ctx.ui.setFooter` is a host no-op stub, so this footer does not render; hotmilk commands still register (see [ROADMAP.md](ROADMAP.md) omp sketch).

## Components

### Startup intro

One widget, `startup-intro`, placed via `ui.setWidget(…, { placement: "aboveEditor" })` (`playHotmilkIntro` in [src/ui/logo.ts](src/ui/logo.ts)) on session `startup` only, rendered through theme roles only. Resume and reload show nothing, and no logo stays on screen afterwards. About 2.5 s at 50 ms frames, centered on the render width:

1. **Rise**: the block-letter "hotmilk" (2× via `scaleBanner`, 10 rows, each cell 2 columns wide; the 5-row banner when the terminal is narrower than the 2× banner) fills with milk from the bottom. The row above the fill ripples (`accent`, `∿`/`~`); a `dim` `∿∿∿` wave runs under the banner. Letters are `text`.
2. **Glint**: an `accent` band sweeps the banner left to right while `dim` `∿` steam drifts in the two rows above.
3. **Lift**: everything turns `dim` and collapses upward row by row, then the widget renders nothing and its timer stops.

Frames are pure (`introLines`, `introTicks`, `scaleBanner`); the widget only advances a tick and remembers the last render width, which sets the frame count. `dispose` stops the timer. Every line is truncated to the render width. No notify banner is sent.

Skipped when `ctx.hasUI` is false. It also plays with `extensions.kanagawa: true`: kanagawa's surfaces are the footer and `belowEditor` widgets (wave, git branch), so the two do not share a slot. `assets/image.jpeg` remains the pi.dev listing image, not a runtime surface.


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
- `/pioneer [task]`: forwards `/skill:pioneer [task]`; info when queued as a follow-up while work runs

### Trust prompt

When `projectTrust.mode` is `prompt` and UI exists, `ctx.ui.confirm` asks `Trust project` with the project cwd and what trust enables. No UI → `undecided`.

## Web surface (hono, Short-term)

The companion web surface renders the Pi API server-side with `hono/jsx`. It carries no client framework; all interaction is links and forms. Styling uses vendored daisyUI CSS served by hono (a browser asset, not a package dependency, and offline-safe). Paging and styles are managed here so the web surface and the TUI stay one design system.

Tokens (web):

| Token    | Value                       | Use                                        |
| -------- | --------------------------- | ------------------------------------------ |
| surface  | `{colors.primary}`          | Page background (Pi default text tone)     |
| web-dim  | `{colors.dim}`              | Metadata, pager counts                     |
| web-link | `{colors.accent}`           | Links, active page, passkey actions        |

Components (web):

- **Header**: the ASCII banner mark (same block letters as the TUI startup intro) plus the page title; no nav tree.
- **Paging**: server-rendered lists paginate at 20 items per page, `?page=N` (1-based), `Prev` / `Next` links rendered only when a previous or next page exists, active page dim. No client-side paging.
- **Styling**: daisyUI classes served from vendored CSS at `/assets/daisyui.css`. No third-party CDN (offline-safe, no supply-chain surface); when the class set outgrows the vendor, switch to a devDependency build (devDependencies are allowed, as with `vp`).

Do's and Don'ts for the web surface:

- Do: keep the JSON API the only data path; pages are hono/jsx views over it.
- Don't: add a client framework (React, TanStack, Remix) — it would break the long-term pi/hono/effect dependency base.
- Don't: serve assets from a third-party CDN.

## Do's and Don'ts

- Do: map every color through the active theme.
- Don't: hardcode colors in hotmilk code.
- Don't: add a second footer or load gentle-pi's `startup-banner`.
- Don't: render the footer when `ctx.hasUI` is false.
- Don't: play the startup intro when `ctx.hasUI` is false.
- Don't: keep a logo on screen after the intro; resume and reload show none.
- Do: keep `/mode` groups aligned with the single bundled-extension registry.
