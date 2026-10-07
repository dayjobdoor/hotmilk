# Maintenance

Change flow, release, config operations, and diagnostics. Structure in [architecture.md](architecture.md); threats in [security.md](security.md).

Sources: [.github/workflows/publish.yml](../.github/workflows/publish.yml), [package.json](../package.json), [src/bootstrap/graph.ts](../src/bootstrap/graph.ts).

## Change flow

How work moves from a horizon to a release. Horizons: [ROADMAP.md](../ROADMAP.md). Agents run this flow through [`skills/pioneer`](../skills/pioneer/SKILL.md).

1. **Start**: name the problem in one sentence (a ROADMAP item or a reported defect). Read [AGENTS.md](../AGENTS.md) → [guidance.md](guidance.md) → the owner doc, then the code the change touches.
2. **Plan**: a one-file fix goes straight to step 3. Anything larger gets one W table in chat ([`skills/pioneer`](../skills/pioneer/SKILL.md)): each level (requirements, system design, detailed design, code) paired with its test design and review gate. No plan files.
3. **Test first**: write the failing test for each acceptance criterion, then the implementation. Touch only files the change needs, reuse patterns in `src/`, keep lazy loading in `src/bootstrap/extensions.ts` intact, and add no speculative abstractions or test-only production hooks.
4. **Verify**: `bun run lint` and `bun run test` pass ([testing.md](testing.md)); CI runs the same gate.
5. **Sync docs** in the same change:

   | Change | Update |
   | ------ | ------ |
   | User-facing behavior | [README.md](../README.md) |
   | TUI surfaces | [DESIGN.md](../DESIGN.md); theme colors in [themes/monokai.json](../themes/monokai.json) |
   | Extension defaults | `defaultEnabled` on the row in [src/config/bundled-extensions.ts](../src/config/bundled-extensions.ts); the `hotmilk.json` template carries no extension defaults |
   | Registry rows (add, remove, omp flag) | [bundles.md](bundles.md) |
   | Layout or startup | [architecture.md](architecture.md), [directory.md](directory.md) |
   | Horizon done or re-scoped | [ROADMAP.md](../ROADMAP.md) (add/remove is a human call) |

6. **Ship**: commits and the PR are the progress record; git history and release notes are the changelog. Publish per [Release](#release).

## Release

1. Bump `version` in [package.json](../package.json). A commit message of `vX.Y.Z` lets CI tag that exact commit.
2. Push `main`. CI runs `bun install --frozen-lockfile` (Bun version pinned in the workflow), then `bun run lint`, then `bun run test`; the `omp-audit` job installs the pinned omp release and runs `bun run audit:omp`.
3. The `publish` job (`needs: [test, omp-audit]`, so an omp audit failure blocks a release) runs only when npm does not already have `hotmilk@<version>`: `npm pack --dry-run`, then `npm publish --provenance --access public` with `NPM_TOKEN` → `NODE_AUTH_TOKEN`.
4. CI then ensures git tag `v<version>` (created on the version-bump commit, or moved to it, else `$GITHUB_SHA`).

- Re-running on the same version skips publish (exact-version check).
- Emergency Pi-only release while `omp-audit` is blocked by omp or the runner: run the workflow manually (`workflow_dispatch`) with `skip_omp_audit` on. The audit is skipped, not ignored: a failed audit still blocks a normal push.
- Actions are pinned to commit SHAs (tag in the trailing comment); bump the SHA when updating them.
- Local publish: `npm login` once, then `npm publish --access public` (token in `~/.npmrc`; `bun publish` also works). `NPM_TOKEN` is CI-only: keep publish tokens out of the repo directory (Bun auto-loads `.env`).
- GitHub Release is optional; npm publish does not require it.

## Config operations

- User config: `$PI_CODING_AGENT_DIR/hotmilk.json`, seeded on first session start when missing.
- Change flow: `/mode` → save → `/reload`.
- Tests and sandboxes: `HOTMILK_CONFIG_ROOT` overrides the config root; `PI_CODING_AGENT_DIR` otherwise.

## Diagnostics

| Signal                                                        | Where                                                                                                                                                 |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Subagent task list, stop controls, history | `/gentle:agents` (when `subagents` on) |
| Orchestration health                                          | `/gentle:doctor`, `/gentle:status` (when `gentle-ai` on)                                                                                             |
| Stale graph                                                   | `graphify-out/needs_update` triggers a session-start warning; `autoSuggestUpdate` appends the `graphify update .` hint (default on in `hotmilk.json`) |
| Full graph rebuild                                            | `graphify .`; scope exclusions in `.graphifyignore`                                                                                                   |
