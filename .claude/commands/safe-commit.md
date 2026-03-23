---
description: Pre-commit checks, security scan, and clean commit — run after /review passes
---

# Safe Commit

Prepare and create a clean, safe git commit. Follow these steps IN ORDER.

**Shell prefix (required for all commands):**
```
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
```

## 1. Pre-flight checks

Run all three. ALL must pass before proceeding:
```
pnpm exec tsc --noEmit
pnpm lint
pnpm test
```

If any fail, fix the issue and re-run. Do not proceed with failures.

## 2. Security scan

Check staged files for secrets/sensitive data:

```
git diff --cached --name-only
```

**Flag and STOP if any of these are staged:**
- `.env.local`, `.env.production`, `.env.*.local`, `.env.e2e`
- Files containing hardcoded API keys, JWTs, passwords, or tokens (grep for `sk-`, `SUPABASE_SERVICE_ROLE`, `ANTHROPIC_API_KEY`, `Bearer `, `eyJ`)
- `*.pem`, `*.p8`, `credentials.json`
- `node_modules/`, `.next/`, `supabase/.temp/`

**Unstage if present (not secrets, just shouldn't be committed):**
- `.DS_Store`, `Thumbs.db`
- Coverage reports (`coverage/`)
- Test output files
- `.claude/` internal files (NOT `.claude/commands/` — those are fine)

## 3. File review

Review untracked files (`git status`):
- Stage only files relevant to the feature/fix
- Never `git add -A` or `git add .`
- New test files: stage them
- New components/pages: stage them
- `CLAUDE.md` updates: stage them
- `docs/` updates: stage them

## 4. Compose commit message

Read the full diff to understand ALL changes. Write a commit message:

- **First line:** `<type>: <summary>` — imperative mood, ≤72 chars
- Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`
- **Body:** WHY and key details (bullet points OK)
- **End with:** `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`

Use a HEREDOC for proper formatting:
```bash
git commit -m "$(cat <<'EOF'
<type>: <summary>

- Detail 1
- Detail 2

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

## 5. Stage and commit

- Stage specific files by name
- Create the commit
- Run `git status` to verify clean state

## 6. Summary

Tell the user:
- What was committed (files, features)
- Any files intentionally excluded and why
- Ask whether to push to `origin main` — never push without asking

## Rules
- NEVER push without explicit user confirmation
- NEVER use `git add -A` or `git add .`
- NEVER skip the pre-flight checks
- NEVER commit `.env` files or secrets
- If `/review` found CRITICAL/HIGH issues that weren't fixed, STOP and tell the user
