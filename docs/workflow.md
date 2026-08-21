# Workflow

Pioneer routing: [skills/pioneer/SKILL.md](../skills/pioneer/SKILL.md). OpenSpec gate: [skills/pioneer/references/openspec-routing.md](../skills/pioneer/references/openspec-routing.md). One plan authority per task.

## Pioneer phases

```mermaid
flowchart TD
  p0["0 Graph recon"] --> p1["1 Goal optional"]
  p1 --> p2["2 Grill if unclear"]
  p2 --> route{3 Plan path}
  route -->|small/bounded| chat["Chat Plan"]
  route -->|browser approval| plan["Plannotator"]
  route -->|research /clear| pwf["planning-with-files"]
  route -->|SDD / cross-cutting| sdd["OpenSpec SDD"]
  chat --> exec["4 Execute"]
  plan --> exec
  pwf --> exec
  sdd --> exec
  metric["Optimize loop"] -.->|mutually exclusive with plan paths| auto["/skill:autoresearch-create"]
```

`observational-memory` and `shazam` are not plan paths. OM is compaction continuity (default off). Shazam is execute-time impact/verify (default off).

## OpenSpec vs Chat Plan

`extensions.gentle-ai` must be **true** for OpenSpec SDD (`/skill:gentle-ai`, `/sdd-*`).

```mermaid
flowchart TD
  ask{User/scope wants SDD?} --> ga{extensions.gentle-ai?}
  ga -->|false| chat["Chat Plan + direct execute only"]
  ask -->|no| chat
  ga -->|true| cfg{openspec/config.yaml?}
  cfg -->|missing| init["/sdd-init or enable sdd-init"]
  init --> sdd
  cfg -->|exists| sdd["/skill:gentle-ai"]
  sdd --> arts["openspec/changes/<change>/"]
  arts --> verify["verify then sync then archive"]
```

Do not mix chat `Plan:` and OpenSpec artifacts for the same change unless the user asks for a sketch first. If gentle-ai drops mid-SDD, stop apply/verify/sync — do not downgrade to Chat Plan. See openspec-routing **Mid-flow recovery**.

## Subagents vs BTW

Both default **on**. They do not share command names.

```mermaid
flowchart LR
  work[Work kind] --> sub["subagents: Task /run /chain"]
  work --> btw["/btw /btw:tangent"]
  sub --> impl[Implementation / SDD phases]
  btw --> q[Quick question while main is busy]
  btw --> inject["/btw:inject back to main"]
```

Verify project agents with `/subagents-doctor` when `subagents` is on.
