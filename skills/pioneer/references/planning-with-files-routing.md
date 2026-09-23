# Planning with Files (Phase 3c)

**Load when:** Plan routing chose **planning-with-files** (heavy research, parallel tracks, or `/clear` recovery).

**Do NOT load when:** Chat Plan, Plannotator, or OpenSpec SDD is the chosen plan authority — use the matching reference instead.

Bundled skill: `@tomxprime/planning-with-files` — read its SKILL.md for templates and scripts. Pioneer gate only.

## When to use

| Signal | Route here |
| ------ | ---------- |
| Heavy research or multi-round investigation | planning-with-files |
| Parallel investigation tracks with distinct findings | planning-with-files |
| `/clear` recovery matters (session may restart) | planning-with-files |
| Human must approve the plan before writes | Plannotator instead |
| Spec/design/tasks contract needed | OpenSpec instead |

**Tie-breaker:** `findings.md` / `progress.md` split outweighs approval or spec artifacts → planning-with-files.

## Artifacts

| File | Purpose | Update |
| ---- | ------- | ------ |
| `task_plan.md` | Phases, status, decisions | After each phase |
| `findings.md` | Research discoveries | After any discovery |
| `progress.md` | Session log, test results | Throughout |

## Workflow

Planning files are created in the **project root** (`./`), not inside the bundled
skill directory. Templates and scripts live under
`node_modules/@tomxprime/planning-with-files/` — copy from templates; never write
planning files there.

```text
1. Create ./task_plan.md, ./findings.md, ./progress.md (project root)
2. Optional Phase 0 graph recon
3. Research → append to ./findings.md (2-action rule)
4. Update ./task_plan.md after each phase; log in ./progress.md
5. Phase 4 execute per task_plan.md; verify per docs/testing.md
```

| Location | What goes there |
| -------- | --------------- |
| Project root (`./`) | `task_plan.md`, `findings.md`, `progress.md` |
| Skill package (`node_modules/@tomxprime/planning-with-files/`) | Templates, scripts, reference — read only |

Commit planning files or add them to `.gitignore` — session state, not intent.

## Artifact separation

| Artifact | Owner |
| -------- | ----- |
| `task_plan.md`, `findings.md`, `progress.md` | planning-with-files (single plan authority) |
| `plans/*.md` | Plannotator — **do not share** with planning files |
| `openspec/changes/<change>/` | OpenSpec — separate authority |

Link across layers in prose only (`See findings.md §3`) — do not make two files the same plan authority.

## Recovery (after `/clear`)

1. Read `./task_plan.md`, `./progress.md`, `./findings.md` immediately (project root).
2. If a catchup report shows unsynced context: run `git diff --stat`, read planning files, update them from catchup + diff, then proceed.
3. Do not re-plan from scratch while `task_plan.md` is valid.

## Execute (Phase 4)

Follow the bundled skill's core pattern: 2-action rule (save findings after every 2 read/search operations), read plan before decisions, update after each phase.

**Verify:** per-step checks in `task_plan.md` + [docs/testing.md](../../../docs/testing.md) Verification (`bun run test`, `bun run lint`).

## Fallback when planning-with-files is off

`extensions.planning-with-files: false` or the bundled skill unavailable?

- Say **"planning-with-files skipped: extension off"**
- Re-route: heavy research → Chat Plan with explicit findings notes in chat; spec needed → OpenSpec
- Do not create `task_plan.md` by hand to imitate the skill

## Anti-patterns

| Do not | Do instead |
| ------ | ---------- |
| Write `task_plan.md` under the skill package or `templates/` | Create `./task_plan.md` at project root |
| Share `task_plan.md` with Plannotator's `plans/*.md` | Separate paths; link in prose only |
| Re-plan from scratch after `/clear` while `task_plan.md` is valid | Restore from planning files + `git diff --stat` |
| Treat findings as a second plan | Findings inform; `task_plan.md` decides |
| Start OpenSpec for the same scope | Pick one plan authority at Phase 3 |
