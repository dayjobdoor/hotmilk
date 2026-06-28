# Prompt-eval gate

**Load when:** A skill or prompt file was edited and the asset will ship (commit, PR, or user asks to harden).

**Do NOT load when:** Read-only tasks; no edits to prompts or skills.

## Enter (mandatory)

Run when **any** of:

- This session edited a file under `skills/` or `prompts/`
- User invokes `/prompt-eval <path>`
- Scenario router: "Skill or prompt edit just completed"

## Skip

Say **"prompt-eval skipped: …"** when:

- No prompt/skill edits this session
- User explicitly ships without hardening

## Run (mandatory)

Invoke **`/prompt-eval <path>`** where `<path>` is the edited skill or prompt file.

Pi resolves `/prompt-eval` to the shipped prompt. Do not read `prompts/*.md` by file path.

If `/prompt-eval` is unavailable, report `prompt-eval skipped: prompt not available`.

## Phase placement

- **Edits-only task:** run after Phase 3 plan (if any) or immediately before ship
- **Mixed task:** run after Phase 4 execute when skill/prompt files changed

## Pioneer NEVER

- Self re-read the target as "evaluation" — fresh executor required
- Ship hardened assets without static coherence check (prompt-eval Step 0)
