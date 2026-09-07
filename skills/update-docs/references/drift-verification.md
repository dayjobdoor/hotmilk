# Drift verification

**Load when:** Phase 4 after any patch, or when reporting "docs already in sync" after completing the applicable verification.

**Do NOT load when:** Recon-only pass with zero edits and no claim of completed verification — skip to a short "no drift found" note instead.

## Truth ownership

- CI owns CI commands and pipeline behavior.
- The manifest owns scripts, dependencies, entry points, and published files.
- Executable code or schemas own runtime behavior and defaults.
- Config templates own values users copy; README samples must match them.

If executable defaults and config-template values disagree without explicit reconciliation, report the unresolved conflict in `Gaps`; do not apply command precedence.

- For command conflicts, use CI > manifest scripts/targets > source comments and record the resolved drift in `Drifts fixed`.
- For conflicts outside these scopes, report unresolved conflicts in `Gaps`; do not choose silently.

## Checklist

Mark each item that applies to scope. All applicable items must pass before "done."

### Always (any patch)

- [ ] Every edited claim traces to a truth file read this session (path named in report)
- [ ] No code or config files changed unless the user explicitly asked to fix defaults
- [ ] Diff stayed within scoped doc files — no cosmetic-only edits elsewhere

### Full sync

- [ ] README commands match their authoritative source (CI for pipeline claims; manifest for scripts/targets); in monorepos, root README uses root manifest — package READMEs use package manifest only
- [ ] Config template in docs matches repo config defaults
- [ ] Path references in edited docs still exist on disk
- [ ] Duplicate facts across docs agree — one canonical source preferred

### Optional (when root instruction files were in scope)

- [ ] Command and layout tables match manifest, CI, and current tree

### Post-ship: dependency / manifest

- [ ] New manifest entries have matching README mention when user-facing
- [ ] Opt-in or experimental features documented when defaults are off

## Commands (adapt to project)

```bash
# Which doc files changed
git diff --name-only -- '*.md'

# Node: list scripts
node -e "console.log(require('./package.json').scripts)"

# Rust: list bin targets
cargo metadata --no-deps --format-version 1 | head

# Python: project scripts (when pyproject.toml exists)
python -c "import tomllib; print(tomllib.load(open('pyproject.toml','rb')).get('project',{}).get('scripts',{}))" 2>/dev/null || true
```

Run the project's test/lint command when code changed in the same task (from README, CONTRIBUTING, CI config, or manifest scripts). Markdown-only sync does not require a full test run.

## Report blockers

If a checklist item fails, report **blocked** with:

- which item failed
- what truth vs doc say
- whether user decision is needed (e.g. intentional undocumented feature)
