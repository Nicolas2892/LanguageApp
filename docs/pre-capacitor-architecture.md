# Pre-Capacitor Architecture Plan

**Created:** 2026-03-23
**Status:** Draft — pending user approval before execution
**Scope:** 4 structural refactors to prepare codebase for Capacitor native shell (Feat-R)

---

## Overview

This document defines four structural refactors that should be completed before Capacitor integration. None change runtime behaviour — they wrap existing code behind cleaner interfaces to make the Capacitor transition a swap-not-scatter operation.

### Risk Assessment

| Refactor | Breaking risk | Why safe |
|----------|--------------|----------|
| Platform abstraction layer | **None** | Same code, behind a function. Every call site keeps identical behaviour. |
| Error boundaries | **None** | Additive — wraps existing components in catch layer. No logic changes. |
| Fire-and-forget utility | **None** | Adds Sentry logging to existing silent catches. No control flow changes. |
| Route constants | **None** | String extraction. Values don't change. TypeScript catches mismatches at compile time. |

All four are verified by the existing test suite (2342 tests). If any test breaks, the refactor introduced a bug — roll back that file.

---

## Refactor 1: Platform Abstraction Layer

### Problem

Browser APIs are called directly in 50+ locations across the codebase. When Capacitor arrives, each location needs an `if (Capacitor.isNativePlatform())` check. This creates:
- Scattered platform logic (hard to audit)
- Duplicated detection code
- Risk of missing a call site

### Solution

Create `src/lib/platform/` with thin wrappers that call browser APIs today, and can be swapped for Capacitor plugins later — one change per capability.

### File Structure

```
src/lib/platform/
  index.ts          ← getPlatform(): 'web' | 'pwa' | 'native'
  storage.ts        ← get/set/remove (wraps localStorage)
  network.ts        ← isOnline(), onStatusChange() (wraps navigator.onLine)
  push.ts           ← requestPermission(), subscribe(), getPermissionState()
  audio.ts          ← speak(), startRecording(), stopRecording()
  haptics.ts        ← impact(), notification(), warning()
  pwa.ts            ← isInstalled(), shouldShowInstallPrompt()
```

### Inventory of Call Sites to Migrate

#### storage.ts (18 call sites)

| File | Key | Purpose |
|------|-----|---------|
| `LevelUpOverlay.tsx` | `last_known_level` | Track CEFR level for level-up modal |
| `useSpeech.ts` | `audio_enabled` | TTS enable/disable preference |
| `StreakFreezeNotification.tsx` | `streak_freeze_used_${date}` | One-time freeze notification gate |
| `WelcomeScreen.tsx` | `welcome_seen` | Welcome screen shown flag |
| `IOSInstallPrompt.tsx` | `pwa_prompt_dismissed` | PWA install prompt dismissal |
| `NotificationSettings.tsx` | `push_prompt_dismissed` | Push prompt dismissal |
| `CurriculumClient.tsx` | `module_completed_${id}_seen` | Module completion celebration gate |
| `StreakMilestone.tsx` | `streak_milestone_${n}_seen` | Milestone notification gate |
| `PushPermissionPrompt.tsx` | `push_prompt_dismissed` | Push prompt dismissal |
| `VerbDetailClient.tsx` | `verb-colour-endings` | Colour endings toggle |
| `SplashScreen.tsx` | `senda-splash-shown` (sessionStorage) | Splash shown gate |
| `ServiceWorkerRegistration.tsx` | `sw-reload` (sessionStorage) | SW reload loop guard |

**Migration pattern:**
```typescript
// Before
localStorage.setItem('audio_enabled', 'true')
const val = localStorage.getItem('audio_enabled')

// After
import { storage } from '@/lib/platform/storage'
storage.set('audio_enabled', 'true')
const val = storage.get('audio_enabled')
```

**Why safe:** Same underlying call. Wrapper adds try/catch (some call sites already have it, some don't — wrapper makes it consistent). No behaviour change.

#### network.ts (15 call sites)

| File | Usage |
|------|-------|
| `useNetworkStatus.ts` | `navigator.onLine` + online/offline event listeners |
| `VerbSession.tsx` | `navigator.onLine` check before fetch |
| `VocabSession.tsx` | `navigator.onLine` check before fetch |
| `global-error.tsx` | `navigator.onLine` for offline UI |
| `dashboard/error.tsx` | `navigator.onLine` for offline UI |
| `progress/error.tsx` | `navigator.onLine` for offline UI |
| `curriculum/error.tsx` | `navigator.onLine` for offline UI |
| `tutor/error.tsx` | `navigator.onLine` for offline UI |
| `study/error.tsx` | `navigator.onLine` for offline UI |
| `verbs/error.tsx` | `navigator.onLine` for offline UI |
| `study/configure/error.tsx` | `navigator.onLine` for offline UI |
| `write/error.tsx` | `navigator.onLine` for offline UI |
| `verbs/[infinitive]/error.tsx` | `navigator.onLine` for offline UI |

**Migration pattern:**
```typescript
// Before
const isOffline = !navigator.onLine

// After
import { isOnline } from '@/lib/platform/network'
const isOffline = !isOnline()
```

**Why safe:** Direct 1:1 wrapper. Same return value.

#### push.ts (6 call sites)

| File | API Used |
|------|----------|
| `PushPermissionPrompt.tsx` | `Notification.requestPermission()`, `pushManager.subscribe()`, `window.atob()` |
| `NotificationSettings.tsx` | `Notification.requestPermission()`, `pushManager.subscribe()`, `window.atob()` |
| `public/sw.js` | `self.addEventListener('push')`, `showNotification()` |

**Note:** The `sw.js` service worker runs in its own context and cannot import from `src/`. It stays as-is until Capacitor replaces it entirely.

#### audio.ts (2 call sites)

| File | API Used |
|------|----------|
| `useSpeech.ts` | `window.speechSynthesis` (TTS) |
| `useSpeechRecognition.ts` | `navigator.mediaDevices.getUserMedia`, `MediaRecorder` (STT) |

**Migration:** Wrap hooks internally. `useSpeech` and `useSpeechRecognition` already serve as the abstraction — just add a `getPlatform()` check inside them when Capacitor arrives.

**Decision:** Do NOT migrate these now. The hooks already are the abstraction. Document the future swap point.

#### haptics.ts (1 call site)

| File | API Used |
|------|----------|
| `useHaptics.ts` | `navigator.vibrate()` |

**Migration:** Same as audio — the hook is already the abstraction. Document future swap to `@capacitor/haptics`.

#### pwa.ts (4 call sites)

| File | API Used |
|------|----------|
| `IOSInstallPrompt.tsx` | `navigator.userAgent`, `navigator.standalone` |
| `IOSInstallCard.tsx` | `navigator.userAgent`, `navigator.standalone` |
| `NotificationSettings.tsx` | `navigator.userAgent`, `navigator.standalone` |

**Migration pattern:**
```typescript
// Before
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
const isStandalone = (navigator as any).standalone === true

// After
import { isIOSDevice, isInstalledPWA } from '@/lib/platform/pwa'
```

### Scope Reduction

After analysis, **only 3 modules need creation now**:

| Module | Call sites | Migrate now? |
|--------|-----------|-------------|
| `storage.ts` | 18 | **Yes** — most scattered, most benefit |
| `network.ts` | 15 | **Yes** — highly repetitive pattern |
| `pwa.ts` | 4 | **Yes** — PWA detection needs Capacitor awareness |
| `push.ts` | 6 | **No** — entire push system gets rewritten for Capacitor |
| `audio.ts` | 2 | **No** — hooks already serve as abstraction |
| `haptics.ts` | 1 | **No** — hook already serves as abstraction |
| `index.ts` | 0 | **Yes** — `getPlatform()` utility needed by others |

**Total files touched:** ~25 component/hook files (import change + function call swap)
**Lines changed per file:** 2–4 (import line + call site replacements)

---

## Refactor 2: Error Boundary Coverage

### Problem

`VerbSession` and `VocabSession` — two high-traffic interactive components — have **zero error protection**. No `<ErrorBoundary>` wrapper, no route-level `error.tsx`. A render error shows a white screen.

### Current Coverage

| Component | ErrorBoundary? | error.tsx? | Status |
|-----------|---------------|-----------|--------|
| StudySession | Yes | Yes | Protected |
| WriteSession | Yes | Yes | Protected |
| DiagnosticSession | (inline) | Yes | Protected |
| TutorChat | No | Yes | Partial |
| **VerbSession** | **No** | **No** | **Unprotected** |
| **VocabSession** | **No** | **No** | **Unprotected** |

### Routes Missing error.tsx

**Critical (user-facing sessions):**
- `/verbs/session` — verb drill session
- `/vocab/session` — vocab drill session

**Medium (functional pages):**
- `/verbs/configure` — verb config
- `/vocab/configure` — vocab config
- `/curriculum/[id]` — concept detail
- `/offline/reports` — offline reports list
- `/offline/reports/[id]` — offline report detail

**Low (admin/auth — low traffic):**
- `/admin`, `/admin/curriculum`, `/admin/exercises`, `/admin/exercises/[id]`, `/admin/pool`
- `/auth/login`, `/auth/signup`
- `/brand-preview`

### Plan

**Phase 1 (this refactor):** Fix the 2 critical gaps + 2 medium gaps.

1. Create `src/app/verbs/session/error.tsx` — copy pattern from `src/app/study/error.tsx`
2. Create `src/app/vocab/session/error.tsx` — same pattern
3. Wrap `VerbSession` in `<ErrorBoundary>` in `src/app/verbs/session/page.tsx`
4. Wrap `VocabSession` in `<ErrorBoundary>` in `src/app/vocab/session/page.tsx`
5. Create `src/app/verbs/configure/error.tsx`
6. Create `src/app/vocab/configure/error.tsx`

**Phase 2 (defer):** Admin, auth, offline routes — low traffic, low risk.

**Template pattern** (all error.tsx files follow this):
```typescript
'use client'
import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { Sentry.captureException(error) }, [error])
  // Branded fallback UI with "Reintentar" button
}
```

**Why safe:** Purely additive. ErrorBoundary catches errors that currently crash. No existing behaviour changes.

---

## Refactor 3: Fire-and-Forget Utility

### Problem

10 fire-and-forget patterns exist across the codebase. 3 are HIGH risk — they silently swallow errors with no Sentry capture, no logging, no visibility. When they fail, we only learn from user bug reports.

### Current State

| File | Operation | Risk | Sentry? |
|------|-----------|------|---------|
| `StudySession.tsx` | POST `/api/sessions/complete` | **HIGH** | No |
| `VerbSession.tsx` | POST `/api/verbs/grade` | **HIGH** | No |
| `VocabSession.tsx` | POST `/api/vocab/grade` | **HIGH** | No |
| `StudySession.tsx` | `import('canvas-confetti')` | LOW | No |
| `AccountForm.tsx` | POST `/api/account/update` (theme) | LOW | No |
| `OfflineStudySession.tsx` | `getAllDownloadedModules().then()` | MEDIUM | No |
| `OfflineGate.tsx` | `getAllDownloadedModules().then()` | MEDIUM | No |
| `ServiceWorkerRegistration.tsx` | `sync.register()` | MEDIUM | No |
| `db.ts` | `requestBackgroundSync()` | MEDIUM | No |
| `StudySession.tsx` | `Promise.all()` exercise generation | MEDIUM | Yes (outer catch) |

### Plan

Create `src/lib/fireAndForget.ts`:

```typescript
import * as Sentry from '@sentry/nextjs'

export function fireAndForget(promise: Promise<unknown>, label: string): void {
  promise.catch((err) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[fireAndForget:${label}]`, err)
    }
    Sentry.captureException(err, { tags: { fire_and_forget: label } })
  })
}
```

**Migration for HIGH-risk sites only:**

```typescript
// Before (StudySession.tsx)
fetch('/api/sessions/complete', { ... }).catch(() => {})

// After
fireAndForget(
  fetch('/api/sessions/complete', { ... }),
  'session-complete'
)
```

**Files to change:** 3 (StudySession.tsx, VerbSession.tsx, VocabSession.tsx)
**Lines changed per file:** 2–3 (import + replace catch)

**Why safe:** Same control flow. Fire-and-forget calls still don't block UI. Only difference: errors now reach Sentry instead of vanishing.

### Not changing (acceptable as-is)

- `canvas-confetti` import — cosmetic, not worth the import
- `AccountForm.tsx` theme — intentionally silent (theme applied locally regardless)
- `requestBackgroundSync()` — Background Sync failures are expected on Safari; logging would be noisy
- `Promise.all()` exercise generation — already has outer try/catch with Sentry

---

## Refactor 4: Route Constants

### Problem

162+ hardcoded route path strings across the codebase. Categories:
- 12 `router.push()` calls
- 75 static + dynamic `Link href` values
- 35 server-side `redirect()` calls
- 5 `NextResponse.redirect` in middleware/callbacks
- 8 pathname comparisons
- 4 `HIDDEN_ROUTES` config arrays (25+ paths)
- 4 `fetch()` calls to API routes

### Scope Decision

**Migrate:** Static route paths used in navigation, links, and redirects.
**Do NOT migrate:**
- Dynamic routes with template literals (`/curriculum/${id}`) — these need the dynamic segment; extracting the prefix alone adds complexity without value
- API fetch paths (`/api/verbs/grade`) — these are internal to their own domain; extracting them obscures the relationship between component and API
- Query parameter construction — too varied to standardize usefully

### Plan

Create `src/lib/routes.ts`:

```typescript
export const ROUTES = {
  // Auth
  login: '/auth/login',
  signup: '/auth/signup',
  authCallback: '/auth/callback',

  // Main
  dashboard: '/dashboard',
  study: '/study',
  studyConfigure: '/study/configure',
  curriculum: '/curriculum',
  verbs: '/verbs',
  verbsConfigure: '/verbs/configure',
  verbsSession: '/verbs/session',
  vocabConfigure: '/vocab/configure',
  vocabSession: '/vocab/session',
  progress: '/progress',
  tutor: '/tutor',
  write: '/write',
  account: '/account',
  onboarding: '/onboarding',

  // Admin
  admin: '/admin',
  adminCurriculum: '/admin/curriculum',
  adminExercises: '/admin/exercises',
  adminPool: '/admin/pool',

  // Offline
  offlineReports: '/offline/reports',

  // Dev
  brandPreview: '/brand-preview',
} as const

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES]
```

**Migrate HIDDEN_ROUTES arrays first** (highest value — 4 files, all use the same paths):
- `AppHeader.tsx` — `HIDDEN_ROUTES`
- `BottomNav.tsx` — `HIDDEN_ROUTES`
- `SideNav.tsx` — `HIDDEN_ROUTES`
- `IOSInstallPrompt.tsx` — `HIDDEN_ROUTES`
- `middleware.ts` — `publicPaths`

**Then migrate `router.push()` and `redirect()` calls** in pages.

**Estimated files touched:** ~35
**Lines changed per file:** 1–3 (import + string replacement)

**Why safe:** Pure string extraction. Values are identical. TypeScript ensures the constant exists at compile time. If a route path is wrong, the existing test that navigates to it will fail.

### What we gain for Capacitor

If Capacitor changes base paths or needs URL scheme prefixes, we change `ROUTES` once — not 162 files.

---

## Execution Order

```
1. Route constants     (src/lib/routes.ts)                    ← foundation, no deps
2. Platform layer      (src/lib/platform/)                    ← depends on nothing
3. Fire-and-forget     (src/lib/fireAndForget.ts)             ← 3 file changes
4. Error boundaries    (4 error.tsx files + 2 page.tsx edits) ← independent
```

Each step is independently shippable and testable. If any step introduces a test failure, it's rolled back without affecting the others.

---

## Verification Plan

After each refactor:
1. `pnpm exec tsc --noEmit` — zero type errors
2. `pnpm lint` — zero lint errors
3. `pnpm test` — 2342 tests pass (no regressions)
4. Manual smoke: navigate to `/verbs/session`, `/vocab/session`, `/dashboard` — confirm no visual changes

---

## What This Document Does NOT Cover

- **Capacitor implementation itself** (push rewrite, keyboard plugin, status bar, deep links) — that's Feat-R
- **Fix-N (Analytics)** — separate work item, no architectural dependency
- **Migration 024/025** — database changes, no code architecture impact
- **Accessibility audit** — content/markup changes, orthogonal to these refactors
- **App Store prep** — non-code (privacy policy, screenshots, nutrition labels)

These are tracked in the main backlog in CLAUDE.md.
