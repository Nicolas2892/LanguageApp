---
description: Post-implementation code review — run after completing any feature or fix before committing
allowed-tools: Read, Grep, Glob, Bash(git diff:*), Bash(git log:*)
---

Perform a comprehensive code review of all changes made in this session.

Review the current diff:
Current changes: !`git diff HEAD`

## Review Sequence (highest impact first)

1. **Security** — Auth enforcement, RLS assumptions, CSRF (validateOrigin), Zod v3 validation, rate-limiting, input sanitization, no secrets in code
2. **Correctness** — Logic bugs, edge cases (null, empty, offline/online), broken code paths, Supabase query casts
3. **Error handling** — Silent catch blocks must be intentional, API routes return proper error responses, client error boundaries exist
4. **TypeScript** — No `any` types, no `@ts-ignore`, proper null checks, Supabase result casts (`data as MyType`)
5. **React/Hooks** — Hook rules, effect cleanup, dependency arrays, no unnecessary re-renders, SSR safety (`typeof window`)
6. **Performance** — N+1 queries, missing `Promise.all` parallelisation, expensive calculations, IDB transaction batching
7. **Production readiness** — No `console.log` (only in catch blocks as silent comments), no TODOs without backlog items, no hardcoded env values
8. **Architecture** — Follows existing patterns, D5 design tokens (never hardcode `text-green-*`), correct file location, Supabase types with `Relationships: []`

## Project-Specific Checks

### Supabase
- Every `.select()` / `.single()` result is cast: `data as MyType`
- No join syntax on tables with `Relationships: []` — separate queries + TS join
- Service role client only in API routes / scripts, never in client components
- `zod` v3 schemas on all POST route bodies

### Offline (Fix-M)
- New Server Component pages have a corresponding `error.tsx` with offline fallback
- IDB writes use proper store names from `STORES` constant
- Cache writers are silent (no UI, catch errors silently)

### D5 Brand
- No `text-green-*` / `bg-green-*` for brand — use `text-primary` / `bg-primary`
- Flash animations (green/red/orange) are OK — they're semantic feedback signals
- Spanish UI strings in Title Case

### Dependencies
- `zod` stays at v3 (NOT v4)
- No `verbs(id, infinitive)` join syntax in `.select()`
- IDB uses `0 | 1` for synced flags (not booleans)

## Severity Levels

| Level | Definition |
|-------|-----------|
| **CRITICAL** | Security vulnerability, data loss, crash, broken auth |
| **HIGH** | Logic bug, significant perf regression, bad UX, broken feature |
| **MEDIUM** | Code quality, missing tests, maintainability concern |
| **LOW** | Style, naming, minor improvement |

## Output Format

### Looks Good
- [Specific thing done well]

### Issues Found

- **[SEVERITY]** `[file:line]` — [What is wrong and why it matters]
  - Fix: [Concrete fix — show corrected code when helpful]

### Summary
- Files reviewed: X
- Critical issues: X
- High issues: X
- Medium issues: X
- Low issues: X

## Rules
- If no issues: "Issues Found" section says `None — this code looks production-ready.`
- Always include at least one "Looks Good" item when warranted
- Every finding must include a concrete fix — never flag without suggesting the solution
- Do not review auto-generated files, lock files, or `node_modules`
- After the review, if there are CRITICAL or HIGH issues, fix them before proceeding to `/safe-commit`
