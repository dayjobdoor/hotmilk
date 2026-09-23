# Roadmap

Horizons for hotmilk: planning intent, not shipped behavior. Current contract: [requirements.md](docs/requirements.md). Add or remove items here as human decisions; keep `docs/requirements.md` to what ships today.

## Principles

- **Pi stays simple; features compose.** Capability pi itself lacks gets assembled by referencing third-party tools as building blocks, never folded into the core. hotmilk is the composition layer: registry rows, one entry point, lazy loads.
- **Registry is data.** One row per bundle in [bundled-extensions.ts](src/config/bundled-extensions.ts); adding a tool = dependency + row + README line.
- **Best-effort upstream, drift watch in CI.** Bundled code is unaudited ([requirements.md](docs/requirements.md) scopes it out); the third-party-risk watch ([test/third-party-risk.test.ts](test/third-party-risk.test.ts)) keeps regressions visible every release.
- **Trust-safe startup.** Project settings load only after project trust; the global dedupe runs at startup, never per-project.
- **TUI is hotmilk-owned.** Footer, `/mode`, `/stop`, `/interrupt`, trust confirm stay coherent ([DESIGN.md](DESIGN.md)).

### Reference sources
External projects and theory that inform these horizons: [docs/references.md](docs/references.md).

## Short-term

- **Third-party triage**: settle the tool classes below; keep drift watch covering every bundled row.
- **Third-party reduction and redesign**: delete stalled/overlapping rows (obsidian, red-green, pi-goal done), swap weak upstreams (goal-x, @runecraft graphify done), and redesign hotmilk-owned replacements where a seam makes it cheap (kanagawa vendoring done; `rtk-optimizer` config-sync seam and the `graphify` skill layer are the next candidates).
- **Docs organization**: `docs/` stays the canonical intent source; sync drift, prune duplicates.
- **Test organization**: contract-first suite; keep closing untested startup and controller paths.
- **UI organization**: footer, `/mode` modal, `/stop`, `/interrupt`, trust confirm stay coherent.

### Candidate packages (evaluated 2026-09-23)

Registry add/remove is a human call; these are the evaluated facts.

| Package | Verdict | Grounds |
| ------- | ------- | ------- |
| [@sfroment/pi-obsidian](https://www.npmjs.com/package/@sfroment/pi-obsidian) 1.0.14 | **Adopt**, replaces the deleted `@haispeed/pi-obsidian` layer | Active (CI + releases), `@earendil-works/*: *` peers, 7 files, typed tool over the obsidian CLI. Default off |
| [pi-warden](https://www.npmjs.com/package/pi-warden) 0.40.1 | **Adopt** as optional supervision layer | New layer (risky actions, stuck loops, unverified "done", security watch) that nothing bundled covers; peers `>=0.85.1 <1` cover current Pi. Default off |
| [pi-web-ui](https://www.npmjs.com/package/pi-web-ui) 0.94.1 | **Watch**, reference for the mid-term **Web UI** horizon, not a bundle | Browser cockpit with its own express/react/ws server (230 files, no declared Pi peers); server-native surface conflicts with hotmilk's TUI ownership |
| [pi-supernova](https://www.npmjs.com/package/pi-supernova) 0.9.1 | **Watch** | CodeMode batch execution overlaps `ctx_execute` (context-mode) and subagents; `sharp` native dep adds supply-chain weight |
| [pi-herdsman](https://www.npmjs.com/package/pi-herdsman) 0.13.0 | **Reject** (layer overlap) | Async subagent orchestration duplicates `subagents` (default on) + `herdr-squad` + `pi-goal-x`; peers `>=0.87 <0.88` add drift surface |
| [@xynogen/pix-optimizer](https://www.npmjs.com/package/@xynogen/pix-optimizer) 1.2.0 | **Watch**: covers the 3 output/perf toggles, but the swap is code work, not a row swap | One `/optimizer` overlay for caveman + RTK + ponytail (13 files, loose peers). Gaps: `rtk-optimizer` is a **Wired seam** (`context-stack.ts` writes its config and `CONTEXT_STACK_EXTENSION_IDS` pins it, so replacement touches context-stack.ts, registry, and tests); ponytail **skills** lost (the bundled package ships `/ponytail` modes via `pi.skills`); the caveman marker differs, which breaks the BTW harness strip and `shouldWarnCavemanJaConflict`; merging 3 ids breaks `hotmilk.json` keys; pix pulls `pix-pretty` to render its own status-bar cell against hotmilk's footer ownership (kanagawa precedent) |

## Mid-term

- **omp support**: run the bundled stack under the Oh My Pi harness as well as pi-coding-agent. Audit-first sketch below.
- **Stabilization**: the bundled stack stays green as upstreams move; shrink the best-effort peer-range surface noted in [README.md](README.md).
- **Web UI**: companion web surface beyond the terminal TUI.
- **Parallel work**: first-class parallel agent execution on top of the bundled subagent stack.
- **Plugin support**: packaged add-ons beyond the bundled registry rows; skills organized into separate collections with one management surface (agent-plugins.org plugin manifests, each carrying its own `skills/`, as the packaging shape).
- **Tetris**: playable break-time easter egg on top of the bundled stack (pi-tetris).

## Long-term

- **ACP optimization**: tune the stack for ACP-based clients.
- **Plugin optimization**: performance and size of the plugin layer.
- **Security hardening**: deepen past trust modes ([security.md](docs/security.md)).
- **Chat app integration**: bridge sessions into chat apps.
- **Model routing**: pick model and provider per task (smol vs capable, cost, fallback) instead of one global default.
- **Secret management**: keep API keys and tokens out of plaintext `hotmilk.json` (OS keychain or env indirection).

## Sequencing

1. Short-term arc first: triage, docs, tests, UI. Nothing later matters if the base drifts.
2. **omp surface audit is the gate** for all omp work: install `oh-my-pi`, read its extension/loading contract, commit to nothing before the audit. Until then the omp sketch below is a checklist, not a commitment.
3. Stabilization and third-party reduction run continuously; the classes below are the reduction's map.
4. Plugin support lands after reduction and the omp audit: it is the portable packaging path toward omp (below).
5. Web UI and parallel work after the base stabilizes.
6. Long-term last.

## Change management

This file is the stable planning view; `openspec/` (local-only, gitignored) is the working layer beneath it.

- **Derivation**: starting work on a horizon item here opens an OpenSpec change: proposal (problem statement), design (trade-offs), spec delta (acceptance criteria), tasks (checkboxes). Propose on start, not for idle items.
- **Progress**: the change's `tasks.md` is the detailed progress record; this file never tracks checkboxes.
- **Changelog**: completing a change archives it under `openspec/changes/archive/<date>-<slug>`; the archive is the changelog.
- **Scope**: `openspec/` stays local and unpublished; canonical intent is `docs/`. The flow is owned by [skills/pioneer/SKILL.md](skills/pioneer/SKILL.md) (routed via [docs/guidance.md](docs/guidance.md)).

## Third-party tool classes

All 33 bundled rows ([src/config/bundled-extensions.ts](src/config/bundled-extensions.ts)), classified by how hotmilk couples to them. This is the work map for triage, reduction, and the omp sketch.

| Class | Ids |
| ---- | ---- |
| Framework substrate (direct dep `gentle-pi`) | skill-registry, sdd-init, gentle-ai |
| Wired: hotmilk owns a seam in `src/` | context-mode, btw, subagents, autoresearch, rtk-optimizer, graphify, kanagawa |
| Registry-only: imported through the loader, no hotmilk code inside | context-view, vcc, ask-user, todo, shazam, prompt-template-model, herdr-squad, lens, web-access, fff, simplify, observational-memory, engram, goal, docparser, intercom, mcp-adapter, codemcp, planning-with-files, plannotator, caveman, ponytail, openspec-context |

This cuts by coupling: a third axis. The `/mode` groups in `bundled-extensions.ts` own UI navigation; the what-you-get labels in [README.md](README.md) own the user story; this file owns the coupling view. Each surface owns its labels: sync facts between them, don't merge the taxonomies.

Wired seams:

- `context-mode`: ctx_search capture for BTW ([src/bootstrap/btw.ts](src/bootstrap/btw.ts)); sequential context-stack phase ([src/bootstrap/context-stack.ts](src/bootstrap/context-stack.ts))
- `btw`: session hook and config injection before the loader import ([src/bootstrap/extensions.ts](src/bootstrap/extensions.ts))
- `subagents`: `/subagents-doctor` ([src/bootstrap/subagents-doctor.ts](src/bootstrap/subagents-doctor.ts))
- `autoresearch`: shortcut seed into the agent dir ([src/bootstrap/autoresearch.ts](src/bootstrap/autoresearch.ts))
- `rtk-optimizer`: RTK config sync and MCP prune ([requirements.md](docs/requirements.md))
- `graphify`: graph.json convention and graph handlers ([src/bootstrap/graph.ts](src/bootstrap/graph.ts))
- `kanagawa`: hotmilk-owned wrapper module that skips the duplicate `/thinking` ([src/bundled/kanagawa.ts](src/bundled/kanagawa.ts))

## omp support: sketch (audit-first)

Grounded today: npm `oh-my-pi` v0.2.0 (acidsugarx, MIT): "Enhancement framework for Pi CLI coding agent: transforms the raw agent into a coordinated multi-agent orchestration system". Its GitHub repo resolves 404 and the package is not installed locally, so internals are unauditable right now.

hotmilk is one entry (`registerHotmilk` in [src/index.ts](src/index.ts)) over three seams: the toggle registry, the loader (`bundledImportUrl`), and the config root (`hotmilk.json`). omp support keeps that shape:

0. **Surface audit (gate)**: install oh-my-pi, inspect its extension and loading contract. Until that audit, commit to nothing below.
1. **Port surface**: registry-only bundles (23) touch no hotmilk code; their internal API usage is unaudited upstream behavior: audit per bundle when omp work starts.
2. **Adapters for wired seams**: each Wired seam gets an omp adapter where omp's API differs. The two runtime-sensitive spots are the ctx_search capture (registerTool identity swap) and the btw session hook (namespace patch).
3. **TUI gate**: the hotmilk-owned TUI (footer, `/mode`) is Pi-TUI-coupled; under omp, degrade to commands-only or adopt omp's UI.
4. **Detection**: probe the harness at startup; the Pi path stays the default.

Distribution: hotmilk already ships skills and agents as package assets; an agent-plugins.org plugin manifest (`plugin.json` + `mcp.json` + `skills/`, schema 1.0.0: the local phi skeleton follows this shape) is the natural portable wrapper toward omp.

Fork-delta note: the Pi fork on this disk (`opi`) changed only its config dir and binary name (`piConfig.configDir` / `name`, env override `OPI_CODING_AGENT_DIR`): expect harness-fork deltas to stay small, audit anyway.

Open questions: omp's extension manifest and loading contract; ExtensionAPI compatibility; whether omp's runtime tolerates the btw namespace patch; where `hotmilk.json` lives under omp's agent dir.

## Design review & caveats

Risks and gates:

- **omp may replace pi-coding-agent rather than extend it**: hotmilk's peer set shifts. Mitigation: the coupling classes are harness-agnostic; port cost is the 7 Wired seams.
- **Upstream drift breaks CI on any release**: accepted via the best-effort stance: drift watch for visibility, third-party reduction for exposure. Full hotmilk-native rebuilds (kanagawa precedent) only for stalled upstreams: not the default.
- **The three label taxonomies can drift apart**: each surface owns its labels (above); reconcile facts only.
- **Gate: if oh-my-pi exposes no extension API comparable to pi's**, omp support degrades to "skills and agents via plugin packaging only": a smaller promise, still useful.

Caveats:

- Upstream bundled code is unaudited: the classes describe hotmilk seams, not upstream quality.
- Registry `group` changes ripple: `/mode` order ([DESIGN.md](DESIGN.md)), the README table: treat as UI contract changes.
- Roadmap add or remove is human (the [AGENTS.md](AGENTS.md) rule extended to this file).
- omp facts are release-dependent (v0.2.0 today); re-verify at audit time.
