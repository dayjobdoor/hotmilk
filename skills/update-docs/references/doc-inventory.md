# Doc inventory

**Load when:** Phase 0 (full sync), or you need the truth → doc matrix for an unfamiliar drift.

**Do NOT load when:** Post-ship route already names the row (read that row here only if unsure), or the user scoped a single file you already know.

Code and config win. Docs below are reconciliation targets. **Adapt rows to the repo** — skip rows that do not exist.

## Detect project type (Phase 0)

Read one manifest first, then use the matching rows:

| Signal file                   | Project type   |
| ----------------------------- | -------------- |
| `package.json`                | Node / JS / TS |
| `Cargo.toml`                  | Rust           |
| `pyproject.toml` / `setup.py` | Python         |
| `go.mod`                      | Go             |
| `pom.xml` / `build.gradle*`   | JVM            |

Also note doc roots if present: `README.md`, `CONTRIBUTING.md`, `docs/`, `CHANGELOG.md`, and any root instruction files (`AGENTS.md`, `CLAUDE.md`, …).

**Monorepo / multi-manifest:** When root and package manifests both exist, treat **root manifest scripts + root README/CONTRIBUTING** as canonical for repo-wide commands. Package READMEs get package-local scripts and paths only — do not copy root commands into every package README unless that package owns them.

## Truth → doc matrix

| Source of truth                                                                | What to extract                                                       | Doc targets                                                                      |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Package manifest (`package.json`, `Cargo.toml`, `pyproject.toml`, `go.mod`, …) | Scripts/commands, deps, version, entry points, published files        | `README.md`, `CONTRIBUTING.md`                                                   |
| Source layout (`src/`, `lib/`, `cmd/`, …)                                      | Module roles, public API surface                                      | README architecture section, `docs/`                                             |
| CI config (`.github/workflows/`, `.gitlab-ci.yml`, …)                          | Test/lint/build commands                                              | `README.md`, `CONTRIBUTING.md`                                                   |
| Config templates in repo root                                                  | Default values users copy                                             | README config sample, setup docs                                                 |
| `CHANGELOG.md` / release tags                                                  | Version, breaking changes                                             | README version notes                                                             |
| `docs/` (when directory exists)                                                | Topic pages, API reference                                            | Cross-link from README; do not create `docs/` during sync                        |
| Root instruction files (when present)                                          | Commands, layout tables, contributor rules                            | That file only — do not invent paths                                             |
| Workspace / monorepo (root + package manifests)                                | Root scripts for repo-wide ops; package scripts for package-local ops | Root README/CONTRIBUTING ↔ root manifest; package README ↔ that package manifest |

## Post-ship triggers (targeted recon)

When the user changed code recently, scan **only** rows touched by the change:

| Change area                                                              | Minimum doc pass                                                            |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| New dependency or entry point                                            | Manifest ↔ README (+ CONTRIBUTING if it lists deps)                         |
| Default config flip or toggle default change                             | Config template ↔ README sample and feature/toggle tables                   |
| Lazy-loaded or opt-in feature (doc mentions it; default off in template) | Template defaults ↔ README — mark opt-in/experimental when default is false |
| New script or test command                                               | Manifest scripts ↔ README + CONTRIBUTING                                    |
| Version / peer bump                                                      | README version note, manifest version constraints                           |
| Public API or module layout change                                       | Layout tables, `docs/` API pages                                            |
| CI workflow change                                                       | CONTRIBUTING / README verify commands                                       |

## Full-sync order

1. Detect project type; read truth files for applicable matrix rows.
2. Read every doc target listed for those rows.
3. Build a diff list — fact mismatches only.
4. Patch the smallest set of files that restores consistency.
5. Run [`drift-verification.md`](drift-verification.md).

## Common drifts (quick scan)

| Symptom                                        | Likely fix                                                                    |
| ---------------------------------------------- | ----------------------------------------------------------------------------- |
| README command does not exist in manifest      | Align with manifest scripts/targets                                           |
| Doc paths point to removed modules             | Update layout table from current tree                                         |
| Config sample shows stale defaults             | Copy from repo config template after confirming code                          |
| Doc lists a feature not in manifest/config     | Remove or mark as external/optional                                           |
| Duplicate facts disagree across two docs       | Pick one canonical source; link from the other                                |
| Doc, manifest, and CI disagree on same command | Apply precedence (CI > manifest > source); report conflict if still ambiguous |
