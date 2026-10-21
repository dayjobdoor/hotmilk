# hotmilk

Skills and themes for [Pi](https://github.com/earendil-works/pi) and [omp](https://github.com/can1357/oh-my-pi). No code, no dependencies, no toggles.

```bash
pi install npm:hotmilk     # or: omp install hotmilk
```

## Contents

| Path                    | What                                                                                   |
| ----------------------- | -------------------------------------------------------------------------------------- |
| `skills/pioneer`        | W-model change flow anchored on a roadmap item                                         |
| `skills/pioneer-review` | Review a diff against its W table                                                      |
| `skills/skill-eval`     | A/B-measure and harden a skill or prompt                                               |
| `skills/comfortzone`    | Coach the agent toward a terminal-check goal; self-coach on long or stalled work (TCZ) |
| `skills/tidy`           | Small, safe cleanups (Tidy First)                                                      |
| `skills/translate`      | English ⇄ Japanese translation                                                         |
| `themes/`               | `monokai`, `kanagawa` (select in `/settings`)                                          |

## Upgrading from 0.2.x

0.3.0 removes the extension layer: `/mode`, `hotmilk.json`, the footer, the startup intro, and all 19 bundled third-party rows. Install what you want directly, for example `pi install npm:context-mode`.

`hotmilk.json` is no longer read. Its `projectTrust` setting (`always` / `never` / `prompt`) no longer applies: project trust falls back to the host default. Users who set `never` must re-apply that through the host's own trust settings.

## License

MIT
