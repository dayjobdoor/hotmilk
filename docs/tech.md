# Tech stack

Pins from [package.json](../package.json) and [.github/workflows/publish.yml](../.github/workflows/publish.yml).

| Layer | Truth |
| ----- | ----- |
| Package | `hotmilk`, ESM (`"type": "module"`) — version in [package.json](../package.json) |
| Runtime | Node — see `engines.node` in [package.json](../package.json) |
| Install / test (this repo) | Bun — CI pin in [.github/workflows/publish.yml](../.github/workflows/publish.yml) |
| Scripts | [package.json](../package.json) scripts (`lint`, `format`, `test`, `check`) |
| Pi peers | `@earendil-works/pi-coding-agent` and matching `pi-*` peers in `peerDependencies` |
| Orchestration | `gentle-pi` in `dependencies` |
| Extension entry | `pi.extensions`: `./src/index.ts` only |
| Lockfile | `bun.lock` committed; no `package-lock.json` |
| CI | push `main` → lint + test → publish when npm package version is new |
| License | MIT |

Default extension toggles: [hotmilk.json](../hotmilk.json). Adding a bundled row: [docs/design.md](design.md#adding-a-bundled-extension).
