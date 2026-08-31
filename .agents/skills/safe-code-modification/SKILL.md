---
name: safe-code-modification
description: Before making large multi-file code changes, create a detailed plan with code snippets, analyze impacts, and wait for explicit confirmation. Supports two confirmation paths — proceed immediately or request clarifications. Trigger when user requests major features, multi-file refactoring, or system-wide changes to Kawaii Bot.
---

# Safe Code Modification

Structured workflow for large, multi-file code changes. Prevents rework by validating the plan before implementation.

## When to Trigger This Skill

Use this skill proactively when the user:

- Asks to add/modify/remove major features across multiple files
- Wants to refactor a subsystem or core module
- Requests changes that affect database schema, API contracts, or shared utilities
- Says "ต้องการให้..." (want/need to make changes) about significant work
- Describes changes affecting >2 files or core architecture
- Is working toward making the project production-ready

**Do NOT trigger** for:
- Single-file edits or small bugfixes
- Adding a single new command or event handler
- Simple configuration adjustments

---

## Step 1: Analyze the Request & Scope

Before proposing any changes, understand:

1. **What files will change?** — List them explicitly
2. **What is the change type?** — New feature, refactor, schema change, removal, extraction
3. **What is the impact radius?** — Which commands, events, or database operations are affected?
4. **Are there dependencies?** — Will changes break existing functionality or require migrations?
5. **Is there a related AGENTS.md note?** — Check the documentation for conventions and pitfalls

Ask clarifying questions if the scope is ambiguous.

---

## Step 2: Create a Detailed Plan with Code Snippets

Present the plan in this structure:

### Files to Modify
- List each file with a brief **before/after description**

### Proposed Changes (with snippets)

For each file, show:
1. **Location**: File path
2. **Current code** (old): Show the existing code that will change
3. **New code** (new): Show the exact replacement
4. **Reason**: Why this change is needed

**Format example:**
```
## File: database.js (Line 50-60)

OLD:
function getSettings(guildId) {
    let settings = db.prepare(...).get(guildId);
    if (!settings) { /* create default */ }
    return settings;
}

NEW:
function getSettings(guildId) {
    let settings = db.prepare(...).get(guildId);
    if (!settings) { 
        db.prepare(...).run(guildId, 'default_value');
        settings = { /* structured default */ };
    }
    return settings;
}

REASON: Support multi-guild configuration with dynamic defaults.
```

### Impact Analysis

Document:
1. **Behavior changes**: What will users/admins observe differently?
2. **Database changes**: Any schema migrations, new tables, or column additions?
3. **API/Command changes**: Do existing commands change their behavior or arguments?
4. **Breaking changes**: Will existing data/configs be incompatible?
5. **Side effects**: Could this affect unrelated features? Performance?
6. **Migration path**: How do existing servers upgrade safely?

### Potential Issues

- List any known risks or edge cases
- Suggest tests or validation steps

---

## Step 3: Present Options for Confirmation

**Stop here and ask the user to choose one:**

```
📋 Plan Summary:
- Files changing: [list]
- New features: [describe]
- Breaking changes: [yes/no + detail]
- Estimated impact: [high/medium/low]

Do you want to:
A) ✅ YES — Proceed with this plan
B) ❓ ต้องการเสริมข้อมูล — Ask clarifying questions first
```

Use `vscode_askQuestions` to present this choice.

---

## Step 4: Branch Based on User Response

### If User Chooses: ✅ YES
→ Execute all changes immediately  
→ Provide confirmation of completion  
→ Remind user of any manual steps (e.g., restart bot, test migrations)

### If User Chooses: ❓ ต้องการเสริมข้อมูล  
→ Listen for clarifications  
→ Revise the plan based on feedback  
→ Return to Step 3 with updated options  
→ Repeat until user is confident

---

## Best Practices

1. **Be conservative with scope**: Show all files that will be touched, even if minimally. Surprise changes erode trust.

2. **Code snippets must be exact**: Include enough context (3-5 lines before/after) so the user can review precisely. No vague descriptions.

3. **Impact is more important than plan**: A user can re-comment a plan, but a missed side effect breaks production. Spend time on the impact section.

4. **Ask about migrations**: If schema changes, explicitly ask: *"Should existing servers migrate automatically, or do admins need to run a manual command?"*

5. **Link to AGENTS.md**: If changes touch conventions or database patterns, reference the [AGENTS.md](../../../AGENTS.md) section so the user can review context.

6. **Default to caution**: If you are unsure about a side effect, mention it. Better to over-document than under-document.

7. **After execution, document the outcome**: Remind user to update AGENTS.md if new conventions or patterns were introduced.

---

## Operating Rules

- **Do not skip Step 3**: Always present the confirmation options. Never auto-execute large changes.
- **One change cycle per message**: If the user requests multiple major changes, handle them sequentially (one plan → confirmation → execution per request).
- **Preserve code integrity**: All code snippets must be copy-paste ready. Test your replacements mentally before presenting.
- **Include rollback notes**: If a change is risky, mention how to undo it (e.g., "restore from database backup", "revert git commit").
- **Re-trigger on scope creep**: If the user adds scope mid-discussion, create a fresh plan and re-confirm.

---

## Example Prompts to Trigger This Skill

- "ต้องการให้เพิ่ม logging system ที่เก็บลง database"
- "refactor commands/ folder เพื่อให้ใช้ dynamic loading"
- "ต้องการให้ migrate pet roles จาก hardcoded เป็น database-driven"
- "add feature ที่ให้ users เปลี่ยน avatar และ สถานะ"
- "ต้องการแยก database.js เป็นหลาย files"

