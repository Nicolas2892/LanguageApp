# PostHog Dashboard Setup Guide

Recommended dashboards and insights to create in the PostHog UI. All events are already being captured — this doc covers how to visualise them.

---

## Dashboards to Create

### 1. Engagement Overview

| Insight | Type | Config |
|---------|------|--------|
| DAU / WAU / MAU | Trends | `$pageview` → unique users → daily/weekly/monthly |
| Sessions per user per day | Trends | `session_started` → total count / unique users |
| Avg session accuracy | Trends | `session_completed` → avg of `correct / total` |
| Active streak distribution | Trends | Person property `streak` histogram |

### 2. Onboarding Funnel

| Step | Event |
|------|-------|
| 1 | `onboarding_started` |
| 2 | `onboarding_complete` |
| 3 | `session_started` (first real session) |

Use **Insights → Funnels**. Conversion window: 7 days. Breakdown by `computed_level` to see if B1 vs B2 users drop off differently.

### 3. Study Session Funnel

| Step | Event |
|------|-------|
| 1 | `session_started` |
| 2 | `exercise_submitted` (at least 1) |
| 3 | `session_completed` |

Breakdown by `practiceMode` to compare SRS vs open practice completion rates.

### 4. Feature Adoption

**Trends** → `feature_first_use` → breakdown by `feature` property.

Shows cumulative first-use counts for:
- `tutor` — AI tutor chat
- `free_write` — free writing mode
- `verb_drill` — verb conjugation drills
- `vocab_drill` — vocabulary drills

### 5. Exercise Performance

| Insight | Config |
|---------|--------|
| Accuracy by type | `exercise_submitted` → % where `isCorrect = true` → breakdown by `exerciseType` |
| Hint usage rate | `hint_requested` count / `exercise_submitted` count |
| Hints by type | `hint_requested` → breakdown by `exerciseType` |
| AI generation usage | `exercise_generated` → total count per week |

### 6. Retention

**Insights → Retention**:
- Returning event: `session_started`
- Period: weekly
- Cohort by: `computed_level` or `days_since_signup` bucket

### 7. Verb & Vocab Drills

| Insight | Config |
|---------|--------|
| Drill starts | `verb_drill_started` + `vocab_drill_started` trends |
| Drill completion rate | Funnel: `verb_drill_started` → `verb_drill_completed` |
| Drill accuracy | `verb_drill_completed` → avg `correct / total` |

### 8. Offline Usage

| Insight | Config |
|---------|--------|
| Module downloads | `offline_module_downloaded` → count per week |
| Sync events | `offline_sync_completed` → count, breakdown by `grammarCount > 0` |

---

## Useful Cohorts

| Cohort | Definition |
|--------|-----------|
| Power users | `streak >= 14` AND `session_started` ≥ 3 in last 7 days |
| At-risk | `session_started` = 0 in last 7 days AND `days_since_signup > 7` |
| New users | `days_since_signup <= 7` |
| B1 learners | `computed_level = B1` |
| B2 learners | `computed_level = B2` |

---

## Person Properties (via `identify`)

| Property | Type | Description |
|----------|------|-------------|
| `computed_level` | string | Current CEFR level (B1/B2/C1) |
| `streak` | number | Current study streak in days |
| `timezone` | string | IANA timezone (e.g. Europe/Berlin) |
| `streak_freeze_remaining` | number | Available streak freezes (0 or 1) |
| `mastered_count` | number | Concepts with interval ≥ 21d + production mastered |
| `days_since_signup` | number | Days since account creation |

---

## Full Event Catalog

| Event | Properties | Source |
|-------|-----------|--------|
| `signup` | — | auth/signup |
| `login` | — | auth/login |
| `onboarding_started` | — | DiagnosticSession |
| `onboarding_complete` | `level` | DiagnosticSession |
| `session_started` | `practiceMode, mode, conceptId` | StudySession |
| `exercise_submitted` | `exerciseType, conceptId, score, isCorrect, practiceMode` | StudySession |
| `session_completed` | `correct, total, practiceMode, elapsedSeconds` | StudySession |
| `hint_requested` | `exerciseType, conceptId, wrongAttempts` | StudySession |
| `exercise_generated` | `conceptId, exerciseType` | StudySession |
| `verb_drill_started` | `tenses, verbSet, length` | VerbSession |
| `verb_drill_completed` | `correct, total` | VerbSession |
| `vocab_drill_started` | `categories, length` | VocabSession |
| `vocab_drill_completed` | `correct, total` | VocabSession |
| `tutor_message_sent` | `conceptId?` | TutorChat |
| `free_write_submitted` | `conceptId` | WriteSession |
| `streak_milestone` | `streak` | StreakMilestone |
| `hard_flag_toggled` | `conceptId, isHard` | HardFlagButton |
| `offline_module_downloaded` | `moduleId, exerciseCount, conceptCount` | useDownloadManager |
| `offline_sync_completed` | `grammarCount, verbCount, reportId?` | useSyncManager |
| `feature_first_use` | `feature` | WriteSession, TutorChat, VerbSession, VocabSession |
