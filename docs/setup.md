# Senda — Development Environment Setup

Complete guide to recreate the development environment from scratch after a clean macOS install.

---

## 1. System-Level Tools

Install in this order:

### Homebrew (package manager)

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

After install, follow the printed instructions to add Homebrew to your PATH (typically adding eval lines to `~/.zprofile`).

### Node.js

```bash
brew install node
```

Verified working version: **v25.6.1** (any recent LTS or current should work).

### pnpm

```bash
brew install pnpm
```

Verified working version: **10.30.3**.

### Git

```bash
brew install git
```

macOS ships with Apple Git, but Homebrew's version is more current. Verified: **2.50.1**.

---

## 2. Claude Code CLI

```bash
npm install -g @anthropic-ai/claude-code
```

Installs to `~/.local/bin/claude`. Verified version: **2.1.76**.

After installing, run `claude` once to authenticate with your Anthropic account.

### Claude Code Memory

Claude Code stores project-specific memory and conversation history in:

```
~/.claude/projects/-Users-nicolas-illg-Library-Mobile-Documents-com-apple-CloudDocs-Claude-languageapp/
```

This directory contains:
- `memory/MEMORY.md` — project memory index (auto-loaded each conversation)
- `memory/*.md` — individual memory files
- `*.jsonl` — conversation transcripts (can be large; safe to lose)

**Before wiping:** Back up `~/.claude/` if you want to preserve conversation history and memory. The `MEMORY.md` file is the most valuable piece — it contains accumulated project context that makes future conversations more efficient.

---

## 3. Project Setup

### Clone the repository

```bash
git clone https://github.com/Nicolas2892/LanguageApp.git
cd LanguageApp
```

### Install dependencies

```bash
pnpm install
```

This pulls all project dependencies from `package.json` + `pnpm-lock.yaml`, including:
- **Framework:** Next.js 16, React 19, TypeScript
- **Database:** @supabase/supabase-js, @supabase/ssr
- **UI:** Tailwind CSS v4, shadcn/ui components, lucide-react icons, recharts
- **AI:** @anthropic-ai/sdk (Claude API), openai (Whisper STT)
- **Offline:** idb v8 (IndexedDB wrapper)
- **Push:** web-push
- **Testing:** Vitest, @testing-library/react, @testing-library/user-event, fake-indexeddb
- **E2E:** Playwright, @playwright/test
- **Monitoring:** @sentry/nextjs, posthog-js
- **Validation:** zod v3 (pinned — do NOT upgrade to v4)
- **Rate limiting:** @vercel/kv

### Install Playwright browsers (for E2E tests)

```bash
pnpm exec playwright install
```

---

## 4. Environment Variables

### `.env.local` (required for dev server)

Create this file in the project root. All values come from your service dashboards:

```bash
# Supabase (https://supabase.com/dashboard → Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Claude API (https://console.anthropic.com → API Keys)
ANTHROPIC_API_KEY=sk-ant-...

# Upstash Redis / Vercel KV (https://console.upstash.com or Vercel dashboard → Storage)
KV_REST_API_URL=https://your-redis.upstash.io
KV_REST_API_TOKEN=your-token
KV_REST_API_READ_ONLY_TOKEN=your-read-only-token
KV_URL=rediss://default:your-token@your-redis.upstash.io:6379
REDIS_URL=rediss://default:your-token@your-redis.upstash.io:6379

# Sentry (https://sentry.io → Settings → Projects)
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/your-project-id
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
SENTRY_AUTH_TOKEN=your-auth-token

# PostHog (https://posthog.com → Project Settings)
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# Push notifications — VAPID keys (generate with: pnpm push:keygen)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-public-key
VAPID_PRIVATE_KEY=your-private-key
VAPID_EMAIL=mailto:you@example.com

# OpenAI Whisper STT (https://platform.openai.com → API Keys)
OPENAI_API_KEY=sk-...

# Cron auth
CRON_SECRET=your-secret
```

### `.env.e2e` (required for E2E tests only)

```bash
E2E_BASE_URL=https://language-app-lilac.vercel.app
E2E_EMAIL=your-test-email
E2E_PASSWORD=your-test-password
```

---

## 5. Verify the Setup

Run these commands to confirm everything works:

```bash
# Set PATH (needed every new shell, or add to ~/.zprofile)
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

# TypeScript check
pnpm exec tsc --noEmit

# Lint
pnpm lint

# Unit tests (1927 tests, ~25s)
pnpm test

# Dev server
pnpm dev
# → http://localhost:3000

# E2E tests (requires .env.e2e + Playwright browsers)
pnpm test:e2e

# Production build
pnpm build
```

---

## 6. Deployment

The app deploys automatically to **Vercel** on push to `main`. No Vercel CLI is needed locally — deployment is handled via the GitHub integration.

- **Production URL:** https://language-app-lilac.vercel.app
- **GitHub repo:** https://github.com/Nicolas2892/LanguageApp.git

All environment variables from `.env.local` must also be configured in the Vercel dashboard (Settings → Environment Variables) for production to work.

### Post-deploy smoke test

```bash
NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... ANTHROPIC_API_KEY=... pnpm exec tsx scripts/smoke-test.ts
```

---

## 7. Database Migrations

Migrations are run **manually** in the Supabase SQL editor (no Supabase CLI). Migration files live in `supabase/migrations/`.

Current migrations (001–022) are all documented in `CLAUDE.md`. When setting up a fresh Supabase project, run them in order.

**Pending migration (not yet applied):**
- `022_offline_reports.sql` — `offline_reports` + `offline_report_attempts` tables

---

## 8. Useful Commands Reference

```bash
pnpm dev                    # Start dev server (http://localhost:3000)
pnpm build                  # Production build
pnpm lint                   # ESLint
pnpm exec tsc --noEmit      # TypeScript check
pnpm test                   # Vitest unit tests (one-shot)
pnpm test:watch             # Vitest watch mode
pnpm test:e2e               # Playwright E2E tests
pnpm seed                   # Seed curriculum data into Supabase
pnpm annotate               # Annotate exercises with grammar spans via Claude
pnpm seed:ai                # Generate new concepts + exercises → review JSON
pnpm seed:ai:apply          # Apply approved entries from review JSON
pnpm seed:verbs             # Generate verb sentences via Claude Haiku
pnpm seed:verbs:apply       # Insert verb_sentences rows
pnpm seed:conjugations      # Generate conjugation paradigms via Claude Haiku
pnpm seed:conjugations:apply # Upsert verb_conjugations rows
pnpm push:keygen            # Generate VAPID key pair for push notifications
pnpm validate:grading       # Offline grading validation (Haiku vs Sonnet)
```

---

## 9. PATH Note

Node and pnpm are installed via Homebrew at `/opt/homebrew/bin/` which is not in the default macOS PATH. Either:

1. **Add to shell profile** (recommended) — append to `~/.zprofile`:
   ```bash
   export PATH="/opt/homebrew/bin:$PATH"
   ```

2. **Prefix each command** (as documented in CLAUDE.md):
   ```bash
   export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
   ```

---

## 10. Optional Tools

| Tool | Purpose | Install |
|------|---------|---------|
| VS Code | Code editor | https://code.visualstudio.com |
| Cursor | AI-integrated editor | https://cursor.com |
| Supabase Dashboard | Database management | https://supabase.com/dashboard (web) |
| Vercel Dashboard | Deployment management | https://vercel.com/dashboard (web) |
| Sentry Dashboard | Error monitoring | https://sentry.io (web) |
| PostHog Dashboard | Product analytics | https://posthog.com (web) |
