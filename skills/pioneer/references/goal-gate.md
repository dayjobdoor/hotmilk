# Goal gate

**Load when:** Phase 1 runs — before grill or plan when session objective may span turns.

## Enter (mandatory)

Run Phase 1 when **any** of:

- Work spans multiple turns or sessions (migration, refactor, feature arc)
- Objective is ambiguous and drift would waste grill/plan cycles
- User sets `/goal` or asks for persistent pursuit
- Grill/plan would benefit from a single north-star sentence

## Skip

Skip Phase 1 when **all** of:

- One-shot, bounded task (typo, single-file fix, known location)
- User asked for a plan on turn 1 with trivial scope
- Active goal already exists — read `get_goal` and align instead of creating a new one

Say **"Goal skipped: …"** with reason when skipping.

## Active goal check

Before Phase 2 or 3:

1. If `extensions.goal: true` and goal tools are available → call `get_goal`
2. Active goal → align grill topics and plan steps to it; do not replace unless user asks
3. Work complete → `update_goal({ status: "complete" })` only with verify evidence per pi-goal

## Commands

Full CLI: bundled **pi-goal** docs.

| Action         | Command                                                 |
| -------------- | ------------------------------------------------------- |
| Set / replace  | `/goal <objective>` or `/goal --tokens 50k <objective>` |
| Read state     | `/goal status` or `get_goal` tool                       |
| Pause / resume | `/goal pause`, `/goal resume`                           |
| Clear          | `/goal clear`                                           |

## Fallback when goal is off

`extensions.goal: false` or goal tools unavailable?

- Say **"Goal skipped: goal extension off"**
- Capture objective in chat **Assumptions** (Chat Plan) or proposal **executive_summary** (OpenSpec)
- Do not invoke `/goal`, `get_goal`, or `update_goal`

## Goal + grill + plan

- Goal sets the north star; grill resolves terms/trade-offs; plan lists steps that advance the goal
- Do not grill unrelated scope when an active goal exists — flag conflict to the user first
