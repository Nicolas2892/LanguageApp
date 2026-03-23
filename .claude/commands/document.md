---
description: Update CLAUDE.md and docs/ based on actual code changes — run after /review and before /safe-commit
allowed-tools: Read, Grep, Glob, Bash(git diff:*), Bash(git status:*), Bash(git log:*), Bash(pnpm:*), Bash(export:*), Write, Edit
---

# Document Skill

Update project documentation to reflect actual code changes. NEVER trust existing docs — verify against source.

**Shell prefix (required):**
```
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
```

## Steps

### 1. Identify what changed

- Run `git diff --name-only` and `git status` to see modified/new files
- Group changes by area: schema, routes, components, lib, tests, config

### 2. Read actual code — verify against source

For each changed area, read the implementation and verify:
- What functions/components exist and what they do
- What routes exist (check `src/app/` tree)
- What types/schemas are defined
- What tests exist and how many pass

### 3. Update CLAUDE.md

CLAUDE.md is the **primary documentation file**. Update these sections as needed:

**Always check and update:**
- **Test suite count** — run `pnpm test` and update the "Test suite: XXXX tests across XXX files" line
- **Route Map** — if new routes were added
- **Key Shared Components & Utilities** — if new shared components were created
- **Database Schema** — if new migrations were added
- **Backlog** — mark completed items as DONE, remove from priority table
- **Current Status** — update CI/test status line

**Check if applicable:**
- **Exercise Types & Components** — if new exercise types were added
- **Environment Variables** — if new env vars were introduced
- **Middleware Rules** — if middleware logic changed
- **Navigation** — if nav items or routes changed
- **CSS Animations & Skeleton** — if new animations were added
- **Loading Skeletons** — if new loading.tsx files were created

### 4. Update docs/completed-features.md

If a backlog item was completed, append its summary to `docs/completed-features.md`:
- Feature name and date
- What was built (key files, tables, decisions)
- What's NOT included (deferred scope)

### 5. Style rules

- **Concise** — sacrifice grammar for brevity
- **Accurate** — verified against actual source, never assumed
- **Current** — if code changed, docs change too
- Tables over prose where possible
- Use code blocks for file paths, function names, types
- Keep entries in the same format as existing entries

### 6. Validation

After updating docs:
- Verify all referenced file paths actually exist (spot-check with Glob)
- Verify test count matches actual output
- Verify route map matches `src/app/` directory structure

### 7. Summary

Tell the user:
- What sections of CLAUDE.md were updated
- Whether `docs/completed-features.md` was updated
- Any docs that need manual review (e.g., migration instructions for Supabase SQL editor)
