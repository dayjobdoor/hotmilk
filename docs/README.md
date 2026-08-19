# hotmilk architecture

Diagrams for contributors. User-facing install and toggles stay in [README.md](../README.md). Commands and layout stay in [AGENTS.md](../AGENTS.md).

| File | Diagrams |
| ---- | -------- |
| [design.md](design.md) | Session startup, extension load order, config surfaces |
| [directory.md](directory.md) | Repo layout |
| [workflow.md](workflow.md) | Pioneer plan paths and OpenSpec SDD |
| [tech.md](tech.md) | Stack pins from `package.json` / CI |

```mermaid
flowchart LR
  Pi["Pi runtime"] --> Entry["src/index.ts"]
  Entry --> Toggles["$PI_CODING_AGENT_DIR/hotmilk.json"]
  Entry --> Bundled["Enabled bundled extensions"]
  Entry --> Assets["pi.skills / pi.prompts / pi.themes"]
  Entry --> Cmds["/mode /stop /interrupt /subagents-doctor"]
```

`pi.skills` / `pi.prompts` / `pi.themes` come from `package.json` (always indexed). They are not gated by `/mode` toggles. `/subagents-doctor` registers only when `extensions.subagents` is on.

```mermaid
flowchart TB
  user[README.md user-facing] --> docs[docs/ diagrams]
  agents[AGENTS.md contributor entry] --> docs
  agents --> pioneer[skills/pioneer]
  agents --> updatedocs[skills/update-docs]
  pioneer --> workflow[docs/workflow.md]
  pioneer --> design[docs/design.md]
  openspec[openspec/ SDD local] --> workflow
```

Defaults: [hotmilk.json](../hotmilk.json). Registry: `BUNDLED_EXTENSION_DEFINITIONS` in [src/config/bundled-extensions.ts](../src/config/bundled-extensions.ts).