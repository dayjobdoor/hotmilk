# References

Pointers, not sources: external projects and theory that inform hotmilk's design. Runtime truth lives in code, CI, and manifests; intent lives in `docs/`, `DESIGN.md`, and [ROADMAP.md](../ROADMAP.md). External URLs are pointers only; bodies are never copied here.

| Reference | Informs |
| --- | --- |
| [pi.dev/packages](https://pi.dev/packages) | Official directory of third-party Pi packages, the composition-layer catalog behind "Pi stays simple; features compose"; scan before building a bundled row. |
| [gentle-pi](https://www.npmjs.com/package/gentle-pi) | Framework substrate; its orchestration and skill-registry patterns set the composition shape. |
| [oh-my-pi](https://www.npmjs.com/package/oh-my-pi) | Harness layering and multi-agent orchestration; audit-first sketch in [ROADMAP.md](../ROADMAP.md). |
| 苫米地理論 (Tomabechi) | Cognitive-science lens on behavior, activation, and learning loops; applied to the agent in the `comfortzone` skill ([TCZ.md](../skills/comfortzone/references/TCZ.md)); applied lens, not a spec. |
| [Claude Code](https://docs.anthropic.com/en/docs/claude-code) | The skills / hooks / plugins pattern family the agent ecosystem builds on: plugin packaging and skill format (Plugin support). |
| [OpenClaw](https://github.com/openclaw/openclaw) | Gateway architecture plus a large skills and plugins ecosystem; informs Chat app integration and multi-channel reach. Not a hotmilk host: it vendors its own Pi runtime and loads only `openclaw.extensions` / native plugins (audited 2026.9.6). |
| [Hermes Agent](https://github.com/NousResearch/hermes-agent) | MIT terminal agent platform with skills, cron, subagents, git worktrees, and messaging gateways; informs Parallel work and chat bridging. Fast-moving: pin a release. |
| [opencode](https://github.com/anomalyco/opencode) | Open-source terminal coding agent (formerly SST): provider-agnostic, build/plan agent split, plugin model; the direct comparable baseline for Pi's agent surface. MIT. |
| [OpenHuman](https://github.com/tinyhumansai/openhuman) | Local-first memory (memory tree, Obsidian-compatible vault) and approvals/sandboxing; informs memory design and Security hardening. GPL-3.0: pattern reference only, never vendor code. |
| [Pi Durable](https://earendil.com/posts/pi-durable/) | Experimental durable harness (`@earendil-works/pi-durable`: checkpointed tasks, forks, tool-owned subagent conversations); candidate substrate for Parallel work and the Native rewrite, not a coding-agent extension. |
| [Cloudflare Code Mode](https://developers.cloudflare.com/agents/tools/codemode/) | MCP tools collapsed into one typed, sandboxed code tool with progressive discovery: tool-surface reduction and the ctx_execute precedent. |

## Evaluated Pi packages (2026-09)

Verdicts and grounds live in the candidate table in [ROADMAP.md](../ROADMAP.md); these rows are the pointers.

| Package | Informs |
| --- | --- |
| [@sfroment/pi-obsidian](https://pi.dev/packages/@sfroment/pi-obsidian) | Obsidian vault layer (typed tool over the obsidian CLI); adoptive candidate for the deleted `@haispeed/pi-obsidian` row. |
| [pi-warden](https://pi.dev/packages/pi-warden) | Supervision layer: risky actions, stuck loops, unverified "done" claims, security watch; nothing bundled covers it. |
| [pi-web-ui](https://pi.dev/packages/pi-web-ui) | Browser cockpit for Pi sessions; reference implementation for the mid-term Web UI horizon. |
| [pi-supernova](https://pi.dev/packages/pi-supernova) | CodeMode batch execution with transactional file ops; comparison point for `ctx_execute` boundaries. |
| [pi-herdsman](https://pi.dev/packages/pi-herdsman) | Async subagent orchestration; rejected: a second subagent stack beside the kept `subagents` row (ROADMAP Subagent elimination), and `pi-goal-x` covers the goal loop. |
| [pi-codemcp](https://pi.dev/packages/pi-codemcp) | Typed, sandboxed Code Mode over MCP servers; was the `codemcp` bundled row, removed: Pi 1.0 ships built-in MCP and codemode (`pi mcp`, `/mcp`), so hotmilk bundles no MCP rows. |
| [@xynogen/pix-optimizer](https://pi.dev/packages/@xynogen/pix-optimizer) | Combined caveman + RTK + ponytail suite; case study in Wired-seam swap costs (`context-stack.ts`, footer ownership). |
