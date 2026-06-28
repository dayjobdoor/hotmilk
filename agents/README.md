# agents/ (package canonical)

Targets **pi-subagents 0.28+** (acceptance gates, foreground `timeoutMs`, per-agent resource limits).

Markdown here is the **source of truth** in git and the npm tarball. Pi does not discover this folder directly — copy or symlink into **`.pi/agents/`** (project scope) or add overrides under **`~/.pi/agent/agents/`** (user scope). Scope rules and precedence: [README § Agents, skills, and scope](../README.md#agents-skills-and-scope).

| Agent     | Role                                                                |
| --------- | ------------------------------------------------------------------- |
| coach     | Teaching — concepts, tradeoffs, harness before code (`coaching.md`) |
| planner   | Plans (bundled LUB / graphify / SDD gates)                          |
| coder     | Single-writer implementation                                        |
| reviewer  | Fresh-context adversarial review                                    |
| assistant | General routing parent                                              |
| designer  | UI / frontend specialist                                            |

Shipped first-party skills: `./skills/` (`tcz-agent-converge`, `pioneer`, `recommend-research`). Shipped prompts: invoke as `/prompt-eval`, `/tidy`, `/translate` — not relative `prompts/` paths. Other skills come from bundled deps via `package.json` → `pi.skills`.
