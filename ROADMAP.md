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

- 0.2.0 minimal core: default-on shrinks to the shipped theme, startup intro, pi/omp harness detection, the footer, and skills; everything else stays bundled but default off (saved `hotmilk.json` toggles kept). Done: registry flip, harness detection, startup intro ([DESIGN.md](DESIGN.md#startup-intro)), and `hotmilk@0.2.0` published to npm on 2026-10-07. Releases are a `package.json` version bump; CI publishes ([maintenance.md](docs/maintenance.md#release)).
- Third-party reduction and redesign: delete stalled/overlapping rows, swap weak upstreams, and redesign hotmilk-owned replacements where a seam makes it cheap. Done: obsidian, red-green, pi-goal, openspec-context removed; goal-x and @runecraft graphify swapped; `rtk-optimizer` config-sync seam (`alignRtkConfig`). Done (2026-10-11): removed 9 rows (kanagawa, caveman, simplify, shazam, planning-with-files, vcc, context-view, prompt-template-model, intercom; kanagawa's vendored extension is gone, its theme stays as a plain theme file), swapped `ask-user` and `todo` to gentle-pi's own modules (`ask-user-question.ts`, `gentle-todo.ts`; no `@juicesharp/rpiv-*`), and added the first-party [`graphify`](skills/graphify/SKILL.md) skill layer (tool choice, freshness, verify in source). Feeds the 0.2.0 default set.
- Third-party triage: settle the tool classes in [docs/bundles.md](docs/bundles.md); keep drift watch covering every bundled row (done: any row whose Pi peer range excludes the installed Pi fails CI until tracked).
- Subagent elimination: remove every subagent bundle; effective capabilities are re-expressed as skills/prompts, the rest deleted. Done: package `agents/` removed (practice folded into `skills/pioneer`), `herdr-squad` and `pi-subagents-j0k3r` removed, `/subagents-doctor` removed. The `subagents` row stays (gentle-ai calls `subagent_run`) on gentle-pi's own `gentle-agents` module.
- Docs organization: `docs/` stays the canonical intent source and owns the change flow ([maintenance.md](docs/maintenance.md#change-flow)), which replaced the local OpenSpec layer; sync drift, prune duplicates.
- Test organization: contract-first suite; keep closing untested startup and controller paths (done 2026-10-11: `/mode` persistence of a toggled row). Open: project-settings dedupe stays off before trust at the `registerBundledExtensions` level (unit-tested only; an integration test needs a cwd seam).
- Comfortzone skill: first-party skill (`skills/comfortzone/`, one theory reference `references/TCZ.md`) that applies TCZ to the agent: the user coaches the agent toward a goal written as terminal checks, and the agent self-coaches on long or stalled work (dist/K_G per loop, T27 stall check, Ethic(B) gate). Merged from the three `tcz-*` drafts; the foundation the GOAL layer builds on.
- Skill layer in ponytail shape: first-party skills follow ponytail's core + companion shape (trigger-phrase description, one job, fixed output with a closing metric line, empty-result sentinel, Boundaries). Done: `pioneer-review` and `skill-eval` (replaced the `prompt-eval` prompt); `skill-eval` over `pioneer` (2026-10-11, 5 iterations, 4 deltas, hold-out passed). Remaining: `skill-eval` over `comfortzone`.
- UI organization: footer, `/mode` modal, `/stop`, `/interrupt`, trust confirm stay coherent.

### 0.2.0 minimal core plan (light)

Done: registry default-off flip, harness detection (`createHotmilkRuntime`, [src/config/runtime.ts](src/config/runtime.ts)), footer and `/mode` hotmilk-owned, skills need no toggle, README default-off note and pinned registry tests. Risk (users lose default-on behavior) is mitigated by `/mode`, release notes, and a one-time session-start notice (`legacyDefaultsLost`, `notices.defaultOff020`). Shipped behavior: [requirements.md](docs/requirements.md).

### Candidate packages (evaluated 2026-09-23, re-checked 2026-10-11)

Registry add/remove is a human call; these are the evaluated facts.

| Package                                                                              | Verdict                                                                          | Grounds                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [@sfroment/pi-obsidian](https://www.npmjs.com/package/@sfroment/pi-obsidian) 1.0.15  | Watch (was Adopt; held back to keep the minimal set)                             | Active, `@earendil-works/*: *` peers, 7 files, typed tool over the obsidian CLI; `pi install npm:@sfroment/pi-obsidian` covers it without a row                                                                                                                                                                                                                                                                                                                                              |
| [pi-warden](https://www.npmjs.com/package/pi-warden) 1.6.0                           | Watch (was Adopt)                                                                | New supervision layer (risky actions, stuck loops, unverified "done", security watch) nothing bundled covers, but peers `>=0.85.1 <1` still exclude Pi 1.x; re-check when they widen                                                                                                                                                                                                                                                                                                         |
| [pi-web-ui](https://www.npmjs.com/package/pi-web-ui) 0.94.1                          | Watch, reference for the mid-term Web UI horizon, not a bundle                   | Browser cockpit with its own express/react/ws server (230 files, no declared Pi peers); server-native surface conflicts with hotmilk's TUI ownership                                                                                                                                                                                                                                                                                                                                         |
| [pi-supernova](https://www.npmjs.com/package/pi-supernova) 0.9.1                     | Watch                                                                            | CodeMode batch execution overlaps `ctx_execute` (context-mode) and subagents; `sharp` native dep adds supply-chain weight                                                                                                                                                                                                                                                                                                                                                                    |
| [pi-herdsman](https://www.npmjs.com/package/pi-herdsman) 0.13.0                      | Reject (layer overlap)                                                           | Async subagent orchestration duplicates `subagents` (gentle-agents) + `pi-goal-x`; peers `>=0.87 <0.88` add drift surface                                                                                                                                                                                                                                                                                                                                                                    |
| [@xynogen/pix-optimizer](https://www.npmjs.com/package/@xynogen/pix-optimizer) 1.2.0 | Watch: covers the output/perf toggles, but the swap is code work, not a row swap | One `/optimizer` overlay for caveman + RTK + ponytail (13 files, loose peers). Gaps: `rtk-optimizer` is a Wired seam (`context-stack.ts` writes its config and `CONTEXT_STACK_EXTENSION_IDS` pins it, so replacement touches context-stack.ts, registry, and tests); ponytail skills lost (the bundled package ships `/ponytail` modes via `pi.skills`); merging ids breaks `hotmilk.json` keys; pix pulls `pix-pretty` to render its own status-bar cell against hotmilk's footer ownership |

## Mid-term

- omp support: run the bundled stack under the Oh My Pi harness as well as pi-coding-agent (14/19 rows done and audited on the pinned `OMP_AUDITED_VERSION`; the rest need omp host APIs, see the sketch below).
- pi/omp dual-native: beyond the audit-gated omp support, resolve the registry, loader, and config root per detected harness so both run natively with no degradation.
- Native rewrite of dependency packages: once the harness design settles (pi/omp dual-native), rewrite bundled rows as hotmilk-native modules; the kanagawa vendoring is a historical precedent (vendored, then removed; its theme stays as a plain theme file), and the long-term pi/hono/effect base is the destination. Specialization priority: the GOAL (pi-goal-x) and web UI surfaces first.
- Third-party rows as presets: the current third-party set is treated as curated presets, not product surface. The design references omp and gentle-pi, and hotmilk specializes toward GOAL (pi-goal-x) and the web UI; breadth outside those layers stays as configurable presets. The arc: presets ship as bundled default-off config now, become on-demand installs once the pi-packages installer lands, and anything that is neither a core native module nor an installable preset leaves the package.
- pi-packages search and install: in-session search over the pi.dev catalog and one-command install through the host's own installer; design below.
- Stabilization: the bundled stack stays green as upstreams move; shrink the best-effort peer-range surface noted in [README.md](README.md). Runs continuously. Pi v1 done (Pi deps and overrides at `^1.1.0`, suite green on Pi 1.1.0 on 2026-10-10; peer ranges still excluding the installed Pi are tracked in [test/third-party-risk.test.ts](test/third-party-risk.test.ts)); the MCP rows and BTW shim are retired ([README.md](README.md#pi-btw-side-questions)).
- Web UI (hono): companion web surface beyond the terminal TUI, built on hono with `hono/jsx` (server-rendered; no client framework, and styling via vendored daisyUI CSS served from hono, a browser asset and not a package dependency; offline-safe, no third-party CDN). Paging and styles are designed and managed in [DESIGN.md](DESIGN.md) (one design system for TUI and web). devDependencies are allowed where they carry the toolchain (`vp` precedent). The only data source is the Pi API, so TanStack/Remix-style client stacks add dependency weight the long-term pi/hono/effect base forbids; the hono JSON API stays the boundary, so a richer client can layer on later. Starts after the base stabilizes (Sequencing 6).
- Parallel work: first-class parallel agent execution rebuilt without the bundled subagent stack; effective subagent capabilities persist as skills/prompts. Substrate candidate: [Pi Durable](https://earendil.com/posts/pi-durable/) (`@earendil-works/pi-durable` 1.1.0, still experimental on 2026-10-11): checkpointed tasks, forkable conversations, subagents as child conversations, compaction and a task graph built in. It is a separate harness with its own extension API (`defineExtension` / `defineTool`), not a coding-agent extension host, and Pi's experimental durable coding agent loads no extensions yet; omp cannot host it. Adopting it belongs to the Native rewrite decision, not a row swap. Until then rows are kept portable by the Durable axis in [docs/bundles.md](docs/bundles.md#pi-durable-fit). Re-evaluate when it leaves experimental.
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

`omp` is [can1357/oh-my-pi](https://github.com/can1357/oh-my-pi) (npm `@oh-my-pi/pi-coding-agent`, Bun-compiled binary; the npm `oh-my-pi` by acidsugarx is unrelated). hotmilk is one entry (`registerHotmilk` in [src/index.ts](src/index.ts)) over three seams (toggle registry, loader, config root); omp support keeps that shape.

Status (contract, rows, and why 5 rows stay pi-only: [docs/bundles.md](docs/bundles.md#omp-support)):

- 0 Surface audit (gate): done.
- 1 Port surface: done, 14/19 rows load via literal specifiers ([src/bootstrap/omp-loaders.js](src/bootstrap/omp-loaders.js)).
- 2 Adapters for wired seams: done, no runtime-sensitive spot left.
- 3 TUI gate: omp stubs `setFooter` / `setHeader`, so the hotmilk footer does not render; the startup intro uses `setWidget` (unverified under omp).
- 4 Detection: done (`CONFIG_DIR_NAME`, no env vars).
- 5 Guarantee: done; `OMP_AUDITED_VERSION` pin plus manual `bun run audit:omp` (18.8.7, re-audited 2026-10-11, 0 mismatches).

Distribution: an agent-plugins.org plugin manifest (`plugin.json` + `mcp.json` + `skills/`, schema 1.0.0) is the natural portable wrapper toward omp.

Fork-delta note: the Pi fork `opi` changed only its config dir and binary name; expect harness-fork deltas to stay small, audit anyway.

Open questions: upstream or hotmilk shims for `MouseRegion` / `withFileMutationQueue` so gentle-pi's `gentle-ai` can load; behavior checks beyond command/tool registration; an omp-native footer via `StatusLineComponent`.

## Design review & caveats

Risks and gates:

- omp may replace pi-coding-agent rather than extend it: hotmilk's peer set shifts. Mitigation: the coupling classes are harness-agnostic; port cost is the 4 Wired seams.
- Upstream drift breaks CI on any release: accepted via the best-effort stance: drift watch for visibility, third-party reduction for exposure. Full hotmilk-native rebuilds (the removed kanagawa vendoring is the historical precedent) only for stalled upstreams: not the default.
- The label taxonomies can drift apart: each surface owns its labels ([docs/bundles.md](docs/bundles.md#classification)); reconcile facts only.
- Gate cleared: omp exposes a Pi-compatible extension API (legacy `pi.extensions` + import shims); the loader gap (computed imports invisible to omp's analyzer) is closed by literal specifiers.

Caveats:

- Upstream bundled code is unaudited: the classes describe hotmilk seams, not upstream quality.
- Registry `group` changes ripple: `/mode` order ([DESIGN.md](DESIGN.md)), the README table: treat as UI contract changes.
- Roadmap add or remove is human (the [AGENTS.md](AGENTS.md) rule extended to this file).
- omp facts are release-dependent: audited 18.3.4 (2026-09-27), re-audited 18.8.7 on 2026-10-11 with 0 mismatches (14/19 rows `omp: true`); the audit is manual, so re-verify on omp upgrades.
