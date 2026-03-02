# Spanish B1→B2 Learning App — Claude Code Plan

## Project Overview

Build a full-stack Spanish language learning application targeting advanced B1 learners aiming for B2 proficiency. The app focuses on **active recall**, **writing production**, and **complex language structures** (connectors, subjunctive, discourse markers, etc.), powered by an AI tutor (Claude) and backed by Supabase.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14+ (App Router) |
| Backend/Auth/DB | Supabase (Postgres + Auth + Realtime) |
| AI Tutor | Anthropic Claude API (claude-sonnet-4-20250514) |
| Styling | Tailwind CSS + shadcn/ui |
| State Management | Zustand or React Context |
| Deployment | Vercel (or self-hosted) |

---

## Core Features & Requirements

### 1. Authentication & User Profile
- Supabase Auth (email/password + Google OAuth)
- User profile: current level assessment, learning goals, daily study target (minutes)
- Onboarding flow: short diagnostic test to assess B1 baseline and identify weak areas

---

### 2. Curriculum Engine

The curriculum is structured around the B1→B2 gap and organized into **modules**:

#### Module Categories
- **Connectors & Discourse Markers** — sin embargo, no obstante, a pesar de que, con tal de que, puesto que, etc.
- **Subjunctive Mastery** — present, imperfect, triggers, doubt/emotion/will clauses
- **Complex Sentence Structures** — relative clauses with subjunctive, hypotheticals, passive voice (se pasiva, ser + participio)
- **Advanced Vocabulary** — collocations, register (formal vs. colloquial), false friends
- **Idiomatic Expressions & Phrasal Verbs** — echar de menos, darse cuenta de, ponerse a + inf
- **Writing Conventions** — paragraph structure, argumentation, transitions, hedging language
- **Listening & Reading Comprehension** (optional stretch goal)

#### Curriculum Data Model (Supabase)
```
modules (id, title, description, level_range, order_index)
units (id, module_id, title, order_index)
concepts (id, unit_id, type, content_json, example_sentences[], difficulty_score)
```

---

### 3. Spaced Repetition System (SRS)

The SRS engine is purely a **scheduling mechanism** — it decides when a concept comes back for review. The user never rates themselves or flips cards. Instead, Claude grades every written response and the SRS interval updates automatically based on that score.

#### How it works
1. User is assigned a writing exercise targeting a specific concept
2. User writes their answer (gap fill, transformation, free write, etc.)
3. Claude grades the response and returns a score (0–3)
4. The app feeds that score into the SM-2 interval formula — no user input needed
5. The concept is scheduled to reappear in N days based on performance
6. When it resurfaces, it comes back as a **new writing exercise** on the same concept (not the same question)

#### Scoring (AI-assigned, not self-rated)
| Claude Score | Meaning | Interval effect |
|---|---|---|
| 0 | Wrong / concept not used | Reset to 1 day |
| 1 | Partially correct / unnatural | Short interval (2–3 days) |
| 2 | Correct but minor errors | Normal interval progression |
| 3 | Correct, natural, confident | Accelerated interval |

#### Data Model
```
user_progress (
  id, user_id, concept_id,
  ease_factor, interval_days, due_date,
  repetition_count, last_reviewed_at
)
```

---

### 4. Exercise Types

All exercises are **production-based** (active recall / writing), not multiple choice:

| Exercise Type | Description |
|---|---|
| **Gap Fill** | Sentence with missing connector/word — user types the answer |
| **Sentence Transformation** | Rewrite sentence using a target structure (e.g. "change to subjunctive") |
| **Translation Prompt** | English sentence → Spanish, targeting a specific structure |
| **Connector Bank** | Paragraph with blanks — choose and place correct connectors in context |
| **Free Write** | Open prompt with a target structure requirement (e.g. "write 3 sentences using aunque + subjunctive") |
| **Error Correction** | Spot and fix grammatical errors in a given sentence |
| **Sentence Builder** | Jumbled words → construct a grammatically correct sentence |

---

### 5. AI Tutor (Claude)

The AI tutor is the heart of the app. Claude is used in multiple ways:

#### 5a. Exercise Grading (drives SRS automatically)
Claude grades **every** written response — this is the only scoring mechanism in the app. There are no self-rating buttons anywhere.

Claude evaluates:
- Was the target concept/structure correctly used?
- Is the sentence grammatically sound?
- Is it natural and idiomatic?
- Returns: `{ score: 0-3, feedback: string, corrected_version: string, explanation: string }`

The returned score is immediately fed into the SRS algorithm to update the concept's next review date. The user sees only the feedback and correction — the scheduling happens invisibly in the background.

#### 5b. Conversational Tutor
A persistent chat interface where the user can:
- Ask why their answer was wrong
- Request more examples of a concept
- Ask for explanations in English or Spanish
- Practice free conversation within a topic
- Get challenged: "Give me 5 more sentences using this connector"

System prompt context includes: current module, concept being studied, user's recent errors, and proficiency level.

#### 5c. Adaptive Hint System
If the user is stuck (>30s on a gap fill, or 2 wrong attempts), Claude offers a progressive hint:
1. Hint 1: Grammatical rule reminder
2. Hint 2: Partial answer with fill-in
3. Hint 3: Full worked example (different sentence)

#### API Integration
```javascript
// Each tutor call includes context
{
  model: "claude-sonnet-4-20250514",
  system: buildTutorSystemPrompt(user, concept, recentErrors),
  messages: conversationHistory,
  max_tokens: 1000
}
```

---

### 6. Progress Tracking & Dashboard

#### Daily Dashboard
- Today's writing exercises (concepts due for review, surfaced as fresh writing challenges)
- Daily streak counter
- Minutes studied today vs. goal
- Module completion progress bars

#### Progress Analytics
- Per-module mastery score (0–100%)
- Accuracy rate per exercise type
- Most missed concepts (flagged for extra review)
- Weekly/monthly activity heatmap (GitHub-style)
- Vocabulary/structure "mastered" count

#### Supabase Data
```
study_sessions (id, user_id, started_at, ended_at, exercises_completed, accuracy_rate)
exercise_attempts (id, user_id, concept_id, exercise_type, user_answer, is_correct, ai_score, ai_feedback, attempted_at)
```

---

### 7. Curriculum Progress & Unlocking

- Modules unlock sequentially (or based on diagnostic)
- A unit is "mastered" when all its concepts reach SRS interval ≥ 21 days
- Progress is visualized as a learning path / skill tree

---

### 8. Notifications & Consistency Mechanics
- Daily reminder (browser notification or email via Supabase edge functions)
- Streak system: don't break the chain
- Weekly summary email: what you studied, what to review

---

## Database Schema Summary (Supabase/Postgres)

```sql
-- Users (managed by Supabase Auth)
profiles (id uuid PK, display_name, current_level, daily_goal_minutes, streak, created_at)

-- Curriculum
modules (id, title, description, order_index)
units (id, module_id, title, order_index)
concepts (id, unit_id, type, title, explanation, examples jsonb, difficulty int)
exercises (id, concept_id, type, prompt, expected_answer, answer_variants jsonb, hint_1, hint_2)

-- User progress
user_progress (id, user_id, concept_id, ease_factor, interval_days, due_date, repetitions, last_reviewed_at)
exercise_attempts (id, user_id, exercise_id, user_answer, is_correct, ai_score, ai_feedback, created_at)
study_sessions (id, user_id, started_at, ended_at, concepts_reviewed int, accuracy numeric)
```

---

## Project Structure (Next.js)

```
/app
  /dashboard          — daily review queue, streak, progress
  /curriculum         — module/unit browser
  /study/[conceptId]  — active study session
  /tutor              — free chat with AI tutor
  /progress           — analytics and history
  /onboarding         — diagnostic + setup
/components
  /exercises          — GapFill, Transform, FreeWrite, etc.
  /tutor              — ChatWindow, MessageBubble, HintPanel
  /ui                 — shadcn components
/lib
  /supabase           — client, server, types
  /claude             — API wrapper, prompt builders
  /srs                — SM-2 algorithm implementation
  /curriculum         — seed data + helpers
```

---

## Implementation Phases for Claude Code

### Phase 1 — Foundation
- [ ] Next.js project setup with Supabase, Tailwind, shadcn
- [ ] Supabase schema: all tables + RLS policies
- [ ] Auth flow: signup, login, profile creation
- [ ] Seed curriculum data (at least 2 modules, 5 units, 20+ concepts)

### Phase 2 — Core Study Loop
- [ ] SRS algorithm implementation (`/lib/srs`)
- [ ] Daily review queue (pull due concepts from Supabase)
- [ ] Exercise renderer (start with GapFill + Sentence Transformation)
- [ ] Exercise submission + answer checking (exact match + Claude grading for open answers)
- [ ] Record attempts in `exercise_attempts`, update `user_progress`

### Phase 3 — AI Tutor
- [ ] Claude API wrapper with context-aware system prompt
- [ ] Post-exercise feedback panel (Claude explains right/wrong)
- [ ] Hint system (progressive reveal)
- [ ] Standalone tutor chat page

### Phase 4 — Progress & Dashboard
- [ ] Dashboard with today's queue, streak, module progress
- [ ] Progress analytics page (charts with recharts or similar)
- [ ] Mastery indicators on curriculum map

### Phase 5 — Polish & Additional Exercise Types
- [ ] Add FreeWrite + ErrorCorrection exercise types
- [ ] Onboarding diagnostic test
- [ ] Email notifications via Supabase Edge Functions
- [ ] Mobile-responsive design pass

---

## Key Design Principles (from Language Learning Research)

1. **Production over recognition** — Every interaction requires the user to write. No multiple choice, no card flipping, no passive review
2. **AI-graded performance drives scheduling** — Claude scores every response; the SRS interval updates automatically with no self-rating by the user
3. **Clear concept nudges** — Every exercise explicitly tells the user which concept/structure to use (e.g. "Use a concessive connector" or "Apply the imperfect subjunctive here")
4. **Contextual learning** — Concepts always appear in sentence and paragraph context, never as isolated grammar rules
5. **Immediate, specific feedback** — Claude explains what was wrong, why, and shows a corrected version after every attempt
6. **Consistency mechanics** — Streaks, daily goals, and short focused sessions beat marathon studying
7. **Interleaved practice** — Mix concept types within a session to prevent illusion of mastery
8. **Graduated difficulty** — Start with more structured exercises (gap fill, transformation), progress to open free writing as mastery grows

---

## Environment Variables Needed

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
```

---

## Notes for Claude Code Plan Mode

- Start with **Phase 1** and get the DB schema right — everything else depends on it
- The SRS algorithm in `/lib/srs` should be a pure function (easy to test)
- Claude API calls should go through a single `/lib/claude/client.ts` wrapper
- Keep all curriculum content in a seed file first; add a CMS later if needed
- Use Supabase RLS from the start — don't bolt it on later
- Prioritize the core study loop (Phase 2) before any AI features — the app must work offline-Claude too
