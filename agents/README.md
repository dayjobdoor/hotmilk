# agents/ (reference copies)

Targets **pi-subagents 0.28+** (acceptance gates, foreground `timeoutMs`, per-agent resource limits).

Markdown here mirrors the hotmilk subagent prompts shipped for optional project install. Discovery and install steps follow `node_modules/pi-subagents/skills/pi-subagents/SKILL.md`.

| Agent     | Role                                                                |
| --------- | ------------------------------------------------------------------- |
| coach     | Teaching — concepts, tradeoffs, harness before code (`coaching.md`) |
| planner   | Plans (bundled LUB / graphify / SDD gates)                          |
| coder     | Single-writer implementation                                        |
| reviewer  | Fresh-context adversarial review                                    |
| assistant | General routing parent                                              |
| designer  | UI / frontend specialist                                            |

Shipped first-party skills: `./skills/` (`tcz-agent-converge`, `pioneer`, `recommend-research`, `empirical-prompt-tuning`). Other skills come from bundled deps via `package.json` → `pi.skills`.
