# anti-slop provenance

- Incoming: bundle of the `install-anti-slop` skill (`~/.agents/skills/install-anti-slop/assets/anti-slop`), copied 2026-10-18. Upstream repository and commit unknown; the bundle is not verified as upstream's latest.
- Base: hotmilk commit `7fcfc88` (v0.1.21, first vendoring). Assumed pristine; not verifiable against upstream.
- Adopted: all incoming changes to rules/shared files, plus new `no-array-filter-map`, `no-reduce-accumulator-copy`, `require-readable-spacing`, `vendor/eslint-stylistic`.
- Local deviations: export `noShapeInSymbolNamesRule` (upstream: `noForbiddenTermInSymbolNamesRule`); `effect/` plugin not installed (removed in v0.1.24).
- Pending: new rules not enabled in `vite.config.ts` (trial: 356 `require-readable-spacing`, 3 `no-array-filter-map` findings; 0 for the other two).
- Backup of pre-update tree: /var/folders/2v/gjb2vdq56d18kp155y_mgspc0000gn/T/tmp.Nw9bGQmQQW/backup
