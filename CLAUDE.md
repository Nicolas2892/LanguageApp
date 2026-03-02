# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Node/pnpm are installed via Homebrew and not in the default PATH. Always prefix shell commands with:
```
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
```

```bash
pnpm dev                  # Start dev server (http://localhost:3000)
pnpm build                # Production build
pnpm lint                 # ESLint
pnpm exec tsc --noEmit   # TypeScript check (no test suite yet)
pnpm seed                 # Seed curriculum data into Supabase (requires env vars)
```

**Seed command** requires env vars inline:
```bash
NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... pnpm seed
```

Re-seeding will duplicate rows — truncate `exercises`, `concepts`, `units`, `modules` first.

## Architecture

### Tech Stack
- **Next.js 16** (App Router, `src/` layout, TypeScript)
- **Supabase** — Postgres + Auth + RLS (no Supabase CLI; migrations run manually in SQL editor)
- **Claude API** (`claude-sonnet-4-20250514`) — grades every exercise; no self-rating by the user
- **shadcn/ui** + Tailwind v4

### Key dependency constraints
- `zod` is pinned to **v3** — do not upgrade to v4, it breaks `@hookform/resolvers@4`
- Supabase types are hand-written in `src/lib/supabase/types.ts` (not CLI-generated). Every table definition must include a `Relationships` array or the SDK infers `never` for all columns. After any `.select()` or `.single()`, cast: `data as MyType`.

### Route map
| Route | Type | Purpose |
|---|---|---|
| `/` | Server | Redirects → `/dashboard` or `/auth/login` |
| `/auth/login` `/auth/signup` | Client | Email/password auth forms |
| `/auth/callback` | Route handler | Supabase OAuth code exchange |
| `/dashboard` | Server | Queue count, streak, progress bar, tutor link |
| `/study` | Server + Client | Study session (fetches queue server-side, renders client-side) |
| `/tutor` | Server + Client | Streaming AI chat; accepts `?concept=<id>` for context |
| `POST /api/submit` | Route handler | Grade answer → SM-2 → upsert `user_progress` → insert `exercise_attempts` |
| `POST /api/hint` | Route handler | Generate Claude worked example for stuck users |
| `POST /api/chat` | Route handler | Streaming tutor chat (plain text ReadableStream) |

### Core learning loop
1. `/app/study/page.tsx` (server) — fetches `user_progress` where `due_date <= today`, or bootstraps 5 easiest concepts for new users; picks one random exercise per concept
2. `/app/study/StudySession.tsx` (client) — state machine: `answering → feedback → [try again |  next]`
3. `POST /api/submit` — Claude grades → SM-2 update → DB writes
4. `/lib/srs/index.ts` — pure `sm2(progress, score)` function; scores 0–3 come from Claude only

### Hint system (in StudySession)
Wrong attempt 1 → shows `exercise.hint_1`. Wrong attempt 2 → shows `exercise.hint_2` + "Show worked example" button. Button calls `POST /api/hint` → Claude generates a fresh example sentence. Hint state resets on each new exercise.

### AI Tutor
- `src/lib/claude/tutor.ts` — `buildTutorSystemPrompt(ctx)` injects user name, level, current concept, and up to 5 recent error feedbacks
- `POST /api/chat` streams plain text chunks via `ReadableStream`; client reads via `response.body.getReader()`
- `TutorChat.tsx` streams tokens into the last message in state as they arrive

### Supabase clients
- `src/lib/supabase/client.ts` — browser client (use in `'use client'` components)
- `src/lib/supabase/server.ts` — server client (Server Components + Route Handlers)
- `src/lib/supabase/middleware.ts` — session refresh + redirect, consumed by `src/middleware.ts`

Auth-gated: all routes except `/auth/*` redirect unauthenticated users to `/auth/login`. Profile row auto-created on signup via `handle_new_user` Postgres trigger.

### Claude integration
- `src/lib/claude/client.ts` — shared `Anthropic` instance + `TUTOR_MODEL` constant
- `src/lib/claude/grader.ts` — `gradeAnswer()` → `{ score: 0–3, is_correct, feedback, corrected_version, explanation }`
- `src/lib/claude/tutor.ts` — `buildTutorSystemPrompt(ctx)` for context-aware chat

### Database schema
| Table | Purpose |
|---|---|
| `profiles` | One row per user; auto-created by trigger |
| `modules / units / concepts / exercises` | Curriculum hierarchy (publicly readable, service role writes) |
| `user_progress` | SRS state per user+concept (`ease_factor`, `interval_days`, `due_date`, `repetitions`) |
| `exercise_attempts` | Full attempt history with AI score + feedback |
| `study_sessions` | Session-level analytics (not yet fully wired) |

Migration: `supabase/migrations/001_initial_schema.sql` — run once in Supabase SQL editor.

## Current Status
Phases 1–4 complete. **Phase 5 is next** (polish + extras):
- Onboarding diagnostic test
- Specialised FreeWrite / ErrorCorrection exercise renderers (currently handled by TextAnswer)
- Email notifications via Supabase Edge Functions
- Mobile-responsive polish pass

### Phase 4 additions
- `recharts` installed for charts
- `/progress` — `MasteryChart`, `AccuracyChart`, `ActivityHeatmap` (all `'use client'`). Data fetched server-side: joins `concepts → units → modules` for mastery, `exercise_attempts → exercises` for accuracy by type, `exercise_attempts` grouped by date for heatmap. Mastered threshold = `interval_days >= 21`.
- `/curriculum` — pure server component, no client JS. Mastery states: `new` (no progress row) / `seen` (interval < 7) / `learning` (7–20) / `mastered` (≥21).
- Dashboard quick-nav grid links to `/tutor`, `/progress`, `/curriculum`.
