# hotmilk architecture

Diagrams for contributors. User-facing install and toggles stay in [README.md](../README.md). Commands and layout stay in [AGENTS.md](../AGENTS.md).

| File                                                     | Diagrams                                               |
| -------------------------------------------------------- | ------------------------------------------------------ |
| [design.md](design.md)                                   | Session startup, extension load order, config surfaces |
| [directory.md](directory.md)                             | Repo layout                                            |
| [../skills/pioneer/SKILL.md](../skills/pioneer/SKILL.md) | Pioneer plan paths and OpenSpec SDD                    |
| [tech.md](tech.md)                                       | Stack pins from `package.json` / CI                    |

For user-facing installation, configuration, toggles, and workflow, see [README.md](../README.md).
For startup order and configuration flow, see [design.md](design.md).
For repository layout, see [directory.md](directory.md).
For stack pins and CI, see [tech.md](tech.md).

Contributor and agent guidance:

- [AGENTS.md](../AGENTS.md) — package contracts and quick commands
- [architecture.md](architecture.md) — architecture rules
- [workflow.md](workflow.md) — implementation and verification
- [reference-map.md](reference-map.md) — progressive-disclosure map

Defaults: `defaultEnabled` in [src/config/bundled-extensions.ts](../src/config/bundled-extensions.ts); graph, persona, language, and trust defaults: [hotmilk.json](../hotmilk.json).
