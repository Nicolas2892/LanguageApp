# Spanish B1→B2 Language Learning App

A full-stack web app for learning Spanish at B1→B2 level. Combines spaced repetition (SM-2 algorithm), AI-graded writing exercises, and a context-aware AI tutor.

## Tech Stack

- **Next.js 16** (App Router, TypeScript)
- **Supabase** (Postgres, Auth, RLS)
- **Claude API** (`claude-sonnet-4-20250514`) — exercise grading + AI tutor
- **shadcn/ui** + Tailwind CSS v4
- **recharts** — analytics charts
- **pnpm** — package manager

## Getting Started

### Prerequisites
- Node.js (via Homebrew: `brew install node`)
- pnpm (`npm install -g pnpm`)
- A Supabase project
- An Anthropic API key

### Environment Variables

Create `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ANTHROPIC_API_KEY=your_anthropic_key
```

### Database Setup

Run `supabase/migrations/001_initial_schema.sql` in the Supabase SQL editor. This creates all tables, RLS policies, and the auto-profile trigger.

### Seed Curriculum

```bash
NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... pnpm seed
```

Seeds 2 modules, 5 units, 21 concepts, 42 exercises (B1→B2 Spanish grammar content).

### Run Dev Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Features

### Study Sessions
- SM-2 spaced repetition — due concepts surface automatically each day
- 6 exercise types: Gap fill, Transformation, Translation, Error correction, Sentence builder, Free write
- Every answer graded by Claude (score 0–3); score feeds directly into SM-2
- Progressive hints: hint 1 → hint 2 → Claude-generated worked example
- Try Again on incorrect answers before moving on
- Session configure screen: pick a module and/or specific exercise types

### Curriculum Browser
- Full module → unit → concept tree
- Mastery badges: New / Seen / Learning / Mastered (based on SRS interval)
- Click any concept, unit, or module to start a targeted practice session

### AI Tutor
- Streaming chat powered by Claude
- Context-aware: inject the current concept from any study card
- Knows your recent mistakes to give targeted help

### Progress Analytics
- Module mastery stacked bar chart
- Accuracy by exercise type bar chart
- 14-week activity heatmap (GitHub-style)

## Project Structure

```
src/
  app/
    api/          # Route handlers: /submit, /hint, /chat
    auth/         # Login, signup, callback pages
    curriculum/   # Curriculum browser
    dashboard/    # Main dashboard
    progress/     # Analytics charts
    study/        # Study session + configure screen
    tutor/        # AI tutor chat
  components/
    exercises/    # GapFill, TextAnswer, SentenceBuilder, ErrorCorrection, FeedbackPanel, HintPanel
    ui/           # shadcn/ui components
  lib/
    claude/       # Anthropic client, grader, tutor system prompt
    curriculum/   # Seed data + runner
    srs/          # SM-2 algorithm
    supabase/     # Client, server, middleware helpers, DB types
supabase/
  migrations/     # SQL schema (run manually in Supabase SQL editor)
```

## Build Status

All Phases 1–4 complete. See `CLAUDE.md` for detailed architecture notes and phase 5 roadmap.
