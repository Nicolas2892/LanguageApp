---
description: Execute the current plan step-by-step with gate checks after each step
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent, TaskCreate, TaskUpdate, TaskGet, TaskList
---

Execute the current implementation plan following the project's development protocol.

**Shell prefix (required for all commands):**
```
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
```

## Prerequisites

- A plan MUST exist in the current conversation (from plan mode or user-provided steps)
- If no plan exists, stop immediately and tell the user to enter plan mode first
- Read CLAUDE.md before starting to ensure full project context

## Before Starting

1. Parse the plan into discrete steps
2. Create a task for each step using TaskCreate (title = step summary, status = pending)
3. Present the execution outline to the user:
   ```
   Executing plan: [N] steps
   1. [step summary] — pending
   2. [step summary] — pending
   ...
   ```
4. Begin execution from step 1

## Execution Protocol

For each step, build bottom-up through the layers that apply. Skip layers that don't apply to the step.

### Layer 1: Types & Schemas

**When:** The step requires new types, Zod schemas, or IDB store changes.

1. Add/update types in the appropriate file (`src/lib/supabase/types.ts`, `src/lib/offline/types.ts`, etc.)
2. Add/update Zod v3 schemas (inline in route handlers or in dedicated files)
3. If IDB schema changes: update `src/lib/offline/db.ts` stores + bump `DB_VERSION`
4. Report: "Layer 1 (types/schemas): done"

### Layer 2: Core Logic & Utilities

**When:** The step requires new business logic, helpers, or lib functions.

1. **Write tests FIRST** in `src/lib/[area]/__tests__/[name].test.ts`
   - Test success paths, error paths, edge cases
   - Follow existing test patterns (mock `@/lib/supabase/server`, use valid UUIDs for Zod)
2. Run: `pnpm exec vitest run src/lib/[area]/__tests__/[name].test.ts`
   - Tests SHOULD fail (red phase)
3. Implement in `src/lib/[area]/[name].ts`
4. Run tests again — iterate until green
5. Report: "Layer 2 (logic): [N] tests passing"

### Layer 3: API Routes

**When:** The step requires new or modified API route handlers.

1. **Write tests FIRST** in `src/app/api/[route]/__tests__/route.test.ts`
   - Test: valid input → correct response
   - Test: invalid input → Zod rejects → 400
   - Test: auth check → 401
   - Mock `@/lib/supabase/server` and `@/lib/claude/client`
2. Run: `pnpm exec vitest run src/app/api/[route]/__tests__/route.test.ts`
3. Implement route handler in `src/app/api/[route]/route.ts`
   - Pattern: auth check → Zod validate → Supabase query → cast result → return JSON
   - Always cast: `data as MyType`
   - Rate-limit where appropriate via `checkRateLimit()`
4. Run tests again — iterate until green
5. Report: "Layer 3 (API): [N] tests passing"

### Layer 4: Server Components (Pages)

**When:** The step includes new pages or page data changes.

1. Create/update page in `src/app/[route]/page.tsx`
   - Pattern: `createClient()` → auth check → parallel queries → cast → render
   - Use `getCached()` for static curriculum data
   - Use `userLocalToday(tz)` for timezone-aware dates
2. Create `loading.tsx` skeleton (use `senda-skeleton-fill animate-senda-pulse`)
3. Create `error.tsx` offline shell if the page makes Supabase queries
4. Add cache writer component if page data should survive offline
5. Report: "Layer 4 (pages): [pages created/updated]"

### Layer 5: Client Components

**When:** The step includes interactive UI.

1. Create/update components in `src/components/`
2. Follow D5 design system: `senda-card`, `senda-eyebrow`, `senda-heading`, `senda-cta`
3. Use `text-primary` / `bg-primary` for brand colour (never `text-green-*`)
4. Spanish UI strings in Title Case
5. Add component tests if the component has meaningful logic
6. Report: "Layer 5 (components): [components created/updated]"

### Gate Check (MANDATORY after every plan step)

Run all three. ALL must pass before proceeding:

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm test
```

**If any check fails:**
- Stop execution immediately
- Report which check failed and the error output
- Attempt to fix (max 2 attempts per failure)
- If still failing after 2 attempts, stop and ask the user for guidance
- Do NOT proceed to the next step with a failing gate

**If all checks pass:**
- Update the task status to complete via TaskUpdate
- Report: `[Step X/N] completed — tests: [pass count], type-check: clean, lint: clean`
- Proceed to the next step

## Progress Reporting

After each step, output:

```
── Progress ─────────────────────────
Step 1: [summary] ✅
Step 2: [summary] ✅
Step 3: [summary] 🔄 in progress
Step 4: [summary] ⏳ pending
─────────────────────────────────────
Tests: [total passing] | Type-check: clean | Lint: clean
```

## Completion

When all steps are done:

1. Run final full gate check
2. Output final summary:
   ```
   ── Execution Complete ───────────────
   Steps completed: [N/N]
   Total tests: [count] passing
   Type-check: clean
   Lint: clean

   Proceeding to: /review
   ─────────────────────────────────────
   ```
3. Automatically proceed to `/review` (per workflow rules)

## Rules

1. **Write tests first** for logic, utilities, and API routes — this is TDD
2. **Never skip gate checks** — stop and fix or ask for help
3. **Never commit code** — that happens in `/safe-commit` after `/review`
4. **Never update CLAUDE.md** — that happens in `/document`
5. If a step is ambiguous, ask the user rather than guessing
6. Keep implementation minimal — follow the plan exactly, no gold-plating
7. Supabase types must have `Relationships: []` — cast all query results
8. No `verbs(id, infinitive)` join syntax — separate queries + TS join
9. `zod` v3 only — never v4
