# Roadmap

Horizons for hotmilk: planning intent, not shipped behavior. Current contract: [requirements.md](docs/requirements.md). Add or remove items here as human decisions; keep `docs/requirements.md` to what ships today.

## Principles

- Pi stays simple; features compose. Capability pi itself lacks gets assembled by referencing third-party tools as building blocks, never folded into the core. hotmilk is the composition layer: registry rows, one entry point, lazy loads.
- Registry is data. One row per bundle in [bundled-extensions.ts](src/config/bundled-extensions.ts); adding a tool = dependency + row + README line.
- Best-effort upstream, drift watch in CI. Bundled code is unaudited ([requirements.md](docs/requirements.md) scopes it out); the third-party-risk watch ([test/third-party-risk.test.ts](test/third-party-risk.test.ts)) keeps regressions visible every release.
- Trust-safe startup. Project settings load only after project trust; the global dedupe runs at startup, never per-project.
- TUI is hotmilk-owned. Footer, `/mode`, `/stop`, `/interrupt`, trust confirm stay coherent ([DESIGN.md](DESIGN.md)).

### Reference sources
External projects and theory that inform these horizons: [docs/references.md](docs/references.md).

## Short-term

- 0.2.0 minimal core: default-on shrinks to the shipped theme, startup intro, pi/omp harness detection, the footer, and skills. Everything else stays bundled but flips default off, matching Pi's minimal-composition philosophy (registry default flip done: every row is off; saved `hotmilk.json` toggles are kept. Harness detection done: `CONFIG_DIR_NAME` probe; under omp only `omp`-flagged rows load. Startup intro done: the 2× banner fills with milk, takes a heat glint, then lifts away, with no persistent header logo, [DESIGN.md](DESIGN.md#startup-intro). Remaining: cut the v0.2.0 release with notes on the default flip, a maintainer call).
- Third-party reduction and redesign: delete stalled/overlapping rows (obsidian, red-green, pi-goal, openspec-context done), swap weak upstreams (goal-x, @runecraft graphify done), and redesign hotmilk-owned replacements where a seam makes it cheap (kanagawa vendoring done; `rtk-optimizer` config-sync seam done: one pure `alignRtkConfig` over two managed fields, synced once before load, its result reported at session start; the `graphify` skill layer is the next candidate). Feeds the 0.2.0 default set.
- Third-party triage: settle the tool classes in [docs/bundles.md](docs/bundles.md); keep drift watch covering every bundled row (every-row peer watch done: any bundled row whose Pi peer range excludes the installed Pi fails CI until tracked).
- Subagent elimination: remove every subagent bundle; only the effective capabilities are re-expressed as skills/prompts, the rest are deleted outright (done: package `agents/` prompts removed and their change-flow practice folded into `skills/pioneer`; the `herdr-squad` row, its skills/prompts, and its dependency removed. The `subagents` row stays because gentle-ai's delegation calls `subagent_run`, but it now loads gentle-pi's own `gentle-agents` module (the retired `pi-subagents-j0k3r`'s successor, same tool names): the `pi-subagents-j0k3r` dependency and hotmilk's `/subagents-doctor` are removed).
- Docs organization: `docs/` stays the canonical intent source and owns the change flow ([maintenance.md](docs/maintenance.md#change-flow)), which replaced the local OpenSpec layer; sync drift, prune duplicates.
- Test organization: contract-first suite; keep closing untested startup and controller paths.
- Comfortzone skill: first-party skill (`skills/comfortzone/`, one theory reference `references/TCZ.md`) that applies TCZ to the agent: the user coaches the agent toward a goal written as terminal checks, and the agent self-coaches on long or stalled work (dist/K_G per loop, T27 stall check, Ethic(B) gate). Merged from the three `tcz-*` drafts; the foundation the GOAL layer builds on.
- UI organization: footer, `/mode` modal, `/stop`, `/interrupt`, trust confirm stay coherent.
- Web UI (hono): minimal companion surface built on hono with `hono/jsx` (server-rendered; no client framework, and styling via vendored daisyUI CSS served from hono, a browser asset and not a package dependency; offline-safe, no third-party CDN). Paging and styles are designed and managed in [DESIGN.md](DESIGN.md) (one design system for TUI and web). devDependencies are allowed where they carry the toolchain (`vp` precedent). The only data source is the Pi API, so TanStack/Remix-style client stacks add dependency weight the long-term pi/hono/effect base forbids; the hono JSON API stays the boundary, so a richer client can layer on later. Last in this arc, per Sequencing.

### 0.2.0 minimal core plan (light)

Mechanics are cheap; the design decision is what "core" means:

1. Registry: flip `defaultEnabled` to `false` for every row except the harness-adjacent set. Theme and logo are static assets (`themes/monokai.json`, `pi.image`) and need no row.
2. Harness detection: a probe in `createHotmilkRuntime` ([src/config/runtime.ts](src/config/runtime.ts)) that records "pi" vs "omp" into the runtime; under omp, enabled rows not flagged `omp: true` are skipped and reported (done).
3. Footer and `/mode` stay hotmilk-owned; `pi.skills` indexing is manifest-level, so skills need no toggle.
4. Docs: README what-you-get gains a "default off" column note; registry tests pin the new defaults.
5. Risk: users lose default-on behavior they rely on; mitigation is `/mode` one-toggle re-enable, release notes, and a one-time session-start notice naming the formerly default-on rows a saved config has no value for (done: `legacyDefaultsLost`, recorded by `notices.defaultOff020`).

### Candidate packages (evaluated 2026-09-23)

Registry add/remove is a human call; these are the evaluated facts.

| Package | Verdict | Grounds |
| ------- | ------- | ------- |
| [@sfroment/pi-obsidian](https://www.npmjs.com/package/@sfroment/pi-obsidian) 1.0.14 | Adopt, replaces the deleted `@haispeed/pi-obsidian` layer | Active (CI + releases), `@earendil-works/*: *` peers, 7 files, typed tool over the obsidian CLI. Default off |
| [pi-warden](https://www.npmjs.com/package/pi-warden) 0.40.1 | Adopt as optional supervision layer | New layer (risky actions, stuck loops, unverified "done", security watch) that nothing bundled covers; peers `>=0.85.1 <1` cover current Pi. Default off |
| [pi-web-ui](https://www.npmjs.com/package/pi-web-ui) 0.94.1 | Watch, reference for the mid-term Web UI horizon, not a bundle | Browser cockpit with its own express/react/ws server (230 files, no declared Pi peers); server-native surface conflicts with hotmilk's TUI ownership |
| [pi-supernova](https://www.npmjs.com/package/pi-supernova) 0.9.1 | Watch | CodeMode batch execution overlaps `ctx_execute` (context-mode) and subagents; `sharp` native dep adds supply-chain weight |
| [pi-herdsman](https://www.npmjs.com/package/pi-herdsman) 0.13.0 | Reject (layer overlap) | Async subagent orchestration duplicates `subagents` (gentle-agents) + `pi-goal-x`; peers `>=0.87 <0.88` add drift surface |
| [@xynogen/pix-optimizer](https://www.npmjs.com/package/@xynogen/pix-optimizer) 1.2.0 | Watch: covers the 3 output/perf toggles, but the swap is code work, not a row swap | One `/optimizer` overlay for caveman + RTK + ponytail (13 files, loose peers). Gaps: `rtk-optimizer` is a Wired seam (`context-stack.ts` writes its config and `CONTEXT_STACK_EXTENSION_IDS` pins it, so replacement touches context-stack.ts, registry, and tests); ponytail skills lost (the bundled package ships `/ponytail` modes via `pi.skills`); the caveman marker differs, which breaks `shouldWarnCavemanJaConflict`; merging 3 ids breaks `hotmilk.json` keys; pix pulls `pix-pretty` to render its own status-bar cell against hotmilk's footer ownership (kanagawa precedent) |

## Mid-term

- omp support: run the bundled stack under the Oh My Pi harness as well as pi-coding-agent (22/28 rows done and CI-audited on omp 18.4.10; the rest need omp host APIs, see the sketch below).
- pi/omp dual-native: beyond the audit-gated omp support, resolve the registry, loader, and config root per detected harness so both run natively with no degradation.
- Native rewrite of dependency packages: once the harness design settles (pi/omp dual-native), rewrite bundled rows as hotmilk-native modules; the kanagawa vendoring is the working precedent, and the long-term pi/hono/effect base is the destination. Specialization priority: the GOAL (pi-goal-x) and web UI surfaces first.
- Third-party rows as presets: the current third-party set is treated as curated presets, not product surface. The design references omp and gentle-pi, and hotmilk specializes toward GOAL (pi-goal-x) and the web UI; breadth outside those layers stays as configurable presets. The arc: presets ship as bundled default-off config now, become on-demand installs once the pi-packages installer lands, and anything that is neither a core native module nor an installable preset leaves the package.
- pi-packages search and install: in-session search over the pi.dev catalog and one-command install through the host's own installer; design below.
- Stabilization: the bundled stack stays green as upstreams move; shrink the best-effort peer-range surface noted in [README.md](README.md). Runs continuously. Pi v1 done: `@earendil-works/pi-*` and their overrides at `^1.0.0`, gentle-pi `^4.0.0` (its `sdd-init` module is gone, so that row was removed), pi-btw `^0.7.1`; the MCP rows (`mcp-adapter`, `codemcp`) and hotmilk's `mcp.json` prune were removed; every bundled row loads on Pi 1.0.0, and the peer ranges still excluding the installed Pi are tracked in [test/third-party-risk.test.ts](test/third-party-risk.test.ts). BTW shim retired: its `createAgentSession` wrap did not take effect on Pi 1.0 (the extension module namespace is read-only), so `btw` is plain upstream pi-btw (`btw.json` for extension sources, `/btw:ask` for read-only tools) and the wired ctx_search capture is gone.
- Web UI: companion web surface beyond the terminal TUI (the hono-based Short-term step starts it).
- Parallel work: first-class parallel agent execution rebuilt without the bundled subagent stack; effective subagent capabilities persist as skills/prompts. Substrate candidate: [Pi Durable](https://earendil.com/posts/pi-durable/) (`@earendil-works/pi-durable`, experimental at 1.0.0): checkpointed tasks, forkable conversations, and a subagent as a tool-owned child conversation. It is a separate harness, not a coding-agent extension (depends on `pi-ai` and `chord`, not `pi-coding-agent`; no built-in subagents; omp cannot host it), so adopting it belongs to the Native rewrite decision, not a row swap. Re-evaluate when it leaves experimental.
- Plugin support: packaged add-ons beyond the bundled registry rows; skills organized into separate collections with one management surface (agent-plugins.org plugin manifests, each carrying its own `skills/`, as the packaging shape).
- Tetris: playable break-time easter egg on top of the bundled stack (pi-tetris).

### pi-packages search and install: design

Not started (Sequencing 4: after reduction). Smallest shape that fits the registry-is-data principle:

- One command, `/ext <query>` (`src/controller/ext.ts`). No toggle, no new dependency.
- Search: `fetch` the npm registry search API for `keywords:pi-package <query>`; `pi-package` is the keyword pi.dev packages carry (every bundled upstream has it). Results show name, version, description, publisher. No local catalog index or cache: npm search is the catalog.
- Harness badge: a result that is already a bundled row shows its `/mode` state and `omp` flag from the registry; any other package shows `unverified on omp` when the host is omp. The per-row omp audit stays a maintainer tool, never an in-session action (it spawns the harness).
- Add: picking a bundled row toggles it in `hotmilk.json` (same write path as `/mode`). Picking another package runs the host's own installer after `ctx.ui.confirm` shows name, version, and publisher: `pi install npm:<name>` (`-l` when the user picks project scope) or `omp install <name>`. Then `/reload`.
- Registry stays code: `/ext` never adds registry rows. Installed packages live in host settings; the existing global dedupe already skips a bundled row when settings provide the same package. Promoting a package to a bundled row stays a reviewed change ([docs/bundles.md](docs/bundles.md#adding-a-row)).
- Trust: an install runs third-party code with full agent capability, so each install MUST be confirmed and MUST NOT run when `ctx.hasUI` is false (print the command instead).
- Checks: controller tests with stubbed `fetch` and `pi.exec`: query → results, confirm → exact installer argv per harness, no-UI → no exec.

## Long-term

- Dependency base: pi / hono / effect only. Every bundled row either ships as a hotmilk-owned module built on these three, or leaves the bundle. Effect-TS hosts the orchestration/error-handling core; hono hosts the web surface; pi stays the harness boundary.
- TCZ self-coaching harness: redesign the harness loop around the `comfortzone` skill. The agent carries the goal as a terminal condition across turns and sessions, measures dist/Φ from executed checks rather than self-report, and on a T27 stall rebuilds the loop instead of retrying; the user coaches by setting goals and reading the K_G trend. Surfaces: a footer dist/K_G cell ([DESIGN.md](DESIGN.md)), a trend page on the hono web UI, and the native GOAL layer that replaces pi-goal-x (Mid-term native rewrite). Ethic(B) stays the gate: the loop tunes the agent's control, never the user's decisions. Lands after the native GOAL layer.
- ACP optimization: tune the stack for ACP-based clients.
- Plugin optimization: performance and size of the plugin layer.
- Security hardening: deepen past trust modes ([security.md](docs/security.md)).
- Chat app integration: bridge sessions into chat apps. First channel candidate: the [OpenClaw](https://github.com/openclaw/openclaw) gateway ([references.md](docs/references.md)) with its skills/plugins ecosystem. Audited 2026-09-27 (openclaw 2026.9.6): OpenClaw vendors its own Pi runtime, reads only `openclaw.extensions` / `openclaw.plugin.json`, and its gateway/embedded runner disables extension discovery, so hotmilk (`pi.extensions`) never loads there; integration means a native OpenClaw plugin, not harness detection.
- Model routing: pick model and provider per task (smol vs capable, cost, fallback) instead of one global default.
- Secret management: keep API keys and tokens out of plaintext `hotmilk.json` (OS keychain or env indirection).
- Web UI passkey authentication: the hono web surface authenticates with passkeys (WebAuthn); credentials stay on the device and no password store exists to leak.

## Sequencing

1. 0.2.0 minimal core first: the default flip rides on third-party reduction plus the docs/tests/UI arc. Nothing later matters if the base drifts.
2. omp surface audit is the gate for all omp work (audit done 2026-09-27, see the omp sketch): the remaining omp steps are commitments only after this file names them.
3. Stabilization and third-party reduction run continuously; the classes in [docs/bundles.md](docs/bundles.md) are the reduction's map.
4. pi-packages search and install lands after reduction: the catalog feeds the registry-driven composition model.
5. pi/omp dual-native and the native rewrite of dependency packages follow once the harness design settles: registry, loader, and config root resolve per harness, then bundled rows go hotmilk-native.
6. Web UI (hono) and parallel work after the base stabilizes.
7. Plugin support lands after reduction and the omp audit: it is the portable packaging path toward omp (below).
8. Long-term last.

## Change management

This file is the stable planning view. Starting work on a horizon item opens one change run through the W-model in [skills/pioneer/SKILL.md](skills/pioneer/SKILL.md), routed via [docs/guidance.md](docs/guidance.md); the repo-level steps live in [docs/maintenance.md](docs/maintenance.md#change-flow).

- Derivation: the horizon item (or a named slice of it) becomes the requirements level; acceptance checks are designed before any code, and the Principles above join the design review gate. Open a change on start, not for idle items.
- Sequencing: a change respects [Sequencing](#sequencing); an item behind an unmet gate stops at requirements.
- Progress: commits and PRs carry progress; this file never tracks checkboxes. On close, finished parts get an inline `done` note (as in Short-term) and what remains of a sliced item stays in its text.
- Changelog: git history and release notes. Canonical intent is `docs/`; the local OpenSpec layer is retired.

## Third-party tool classes

The current classification of all bundled rows (`/mode` group, coupling class, wired seams, omp support, recommendation level) lives in [docs/bundles.md](docs/bundles.md). The coupling classes there are the work map for triage, reduction, and harness ports.

## omp support: sketch (audit-first)

Grounded 2026-09-27: `omp` is [can1357/oh-my-pi](https://github.com/can1357/oh-my-pi) (npm `@oh-my-pi/pi-coding-agent` 18.3.4, Bun-compiled binary). The npm `oh-my-pi` 0.2.0 (acidsugarx) cited earlier is an unrelated package.

hotmilk is one entry (`registerHotmilk` in [src/index.ts](src/index.ts)) over three seams: the toggle registry, the loader (`bundledImportUrl`), and the config root (`hotmilk.json`). omp support keeps that shape:

0. Surface audit (gate): done. omp loads `package.json` → `omp.extensions` with `pi.extensions` fallback, imports modules with Bun, and rewrites `@earendil-works/*` / `typebox` imports onto host copies, but only inside the extension's own module graph.
1. Port surface: done for 22/28 rows. omp's analyzer follows only literal import specifiers, so hotmilk's computed `file://` imports left bundled packages outside the rewrite (27 rows failed on `@earendil-works/*`, `typebox`, `minimatch`). Under omp hotmilk now imports each row through a literal specifier ([src/bootstrap/omp-loaders.js](src/bootstrap/omp-loaders.js)); 22 rows load and register commands or tools. The other 6 and why: [docs/bundles.md](docs/bundles.md) (omp host lacks `MouseRegion` / `withFileMutationQueue` / `generateUnifiedPatch`, or the row shows no command or tool to verify).
2. Adapters for wired seams: each Wired seam gets an omp adapter where omp's API differs. No runtime-sensitive spot is left: the ctx_search capture and the btw session hook went away with the BTW shim.
3. TUI gate: omp documents `ctx.ui.setFooter` / `setHeader` as no-op stubs, so the hotmilk footer (`setFooter`) does not render; the startup intro uses `setWidget` (unverified under omp); `/mode`, `/stop`, `/interrupt` register (audited).
4. Detection: done. `CONFIG_DIR_NAME` from `@earendil-works/pi-coding-agent` is `.omp` under omp (host rewrite) and `.pi` under Pi; env vars are not used because they leak between nested harness processes.
5. Guarantee: done. `OMP_AUDITED_VERSION` pins the omp release; CI installs it (checksum-verified) and `bun run audit:omp` blocks publish when any `omp` flag disagrees with the audit. Other releases warn at session start. Contract: [docs/bundles.md](docs/bundles.md#omp-support).

Distribution: hotmilk already ships skills as package assets; an agent-plugins.org plugin manifest (`plugin.json` + `mcp.json` + `skills/`, schema 1.0.0: the local phi skeleton follows this shape) is the natural portable wrapper toward omp.

Fork-delta note: the Pi fork on this disk (`opi`) changed only its config dir and binary name (`piConfig.configDir` / `name`, env override `OPI_CODING_AGENT_DIR`): expect harness-fork deltas to stay small, audit anyway.

Open questions: upstream or hotmilk shims for `MouseRegion` / `withFileMutationQueue` so gentle-pi's `gentle-ai` can load; behavior checks beyond command/tool registration; an omp-native footer via `StatusLineComponent`. Answered: manifest/loading contract, ExtensionAPI compatibility (legacy shims), the loader gap (literal specifiers), the btw patch (retired with the BTW shim), `hotmilk.json` location (omp agent dir), and the detection signal.

## Design review & caveats

Risks and gates:

- omp may replace pi-coding-agent rather than extend it: hotmilk's peer set shifts. Mitigation: the coupling classes are harness-agnostic; port cost is the 5 Wired seams.
- Upstream drift breaks CI on any release: accepted via the best-effort stance: drift watch for visibility, third-party reduction for exposure. Full hotmilk-native rebuilds (kanagawa precedent) only for stalled upstreams: not the default.
- The label taxonomies can drift apart: each surface owns its labels ([docs/bundles.md](docs/bundles.md#classification)); reconcile facts only.
- Gate cleared: omp exposes a Pi-compatible extension API (legacy `pi.extensions` + import shims); the loader gap (computed imports invisible to omp's analyzer) is closed by literal specifiers.

Caveats:

- Upstream bundled code is unaudited: the classes describe hotmilk seams, not upstream quality.
- Registry `group` changes ripple: `/mode` order ([DESIGN.md](DESIGN.md)), the README table: treat as UI contract changes.
- Roadmap add or remove is human (the [AGENTS.md](AGENTS.md) rule extended to this file).
- omp facts are release-dependent (18.3.4 audited 2026-09-27; 18.4.2, 18.4.9 and 18.4.10 re-audited with no flag changes, 18.4.10 on 2026-10-02); re-verify on omp upgrades.
