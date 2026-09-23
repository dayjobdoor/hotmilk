# Maintenance

Release, config operations, and diagnostics. Structure in [architecture.md](architecture.md); threats in [security.md](security.md).

Sources: [.github/workflows/publish.yml](../.github/workflows/publish.yml), [package.json](../package.json), [src/bootstrap/subagents-doctor.ts](../src/bootstrap/subagents-doctor.ts), [src/bootstrap/graph.ts](../src/bootstrap/graph.ts).

## Release

1. Bump `version` in [package.json](../package.json). A commit message of `vX.Y.Z` lets CI tag that exact commit.
2. Push `main`. CI runs `bun install --frozen-lockfile` (Bun `1.3.14`), then `bun run lint`, then `bun run test`.
3. The `publish` job (`needs: test`) runs only when npm does not already have `hotmilk@<version>`: `npm pack --dry-run`, then `npm publish --provenance --access public` with `NPM_TOKEN` → `NODE_AUTH_TOKEN`.
4. CI then ensures git tag `v<version>` (created on the version-bump commit, or moved to it, else `$GITHUB_SHA`).

- Re-running on the same version skips publish (exact-version check).
- Local publish: `npm login` once, then `npm publish --access public` (token in `~/.npmrc`; `bun publish` also works). `NPM_TOKEN` is CI-only.
- GitHub Release is optional; npm publish does not require it.

## Config operations

- User config: `$PI_CODING_AGENT_DIR/hotmilk.json`, seeded on first session start when missing.
- Change flow: `/mode` → save → `/reload`.
- Tests and sandboxes: `HOTMILK_CONFIG_ROOT` overrides the config root; `PI_CODING_AGENT_DIR` otherwise.

## Diagnostics

| Signal                                                        | Where                                                                                                                                                 |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Subagent runtime report (module, config, agent dirs, session) | `/subagents-doctor` (when `subagents` on)                                                                                                             |
| Orchestration health                                          | `/gentle:doctor`, `/gentle:status` (when `gentle-ai` on)                                                                                             |
| Stale graph                                                   | `graphify-out/needs_update` triggers a session-start warning; `autoSuggestUpdate` appends the `graphify update .` hint (default on in `hotmilk.json`) |
| Full graph rebuild                                            | `graphify .`; scope exclusions in `.graphifyignore`                                                                                                   |
