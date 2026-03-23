---
description: Run tests — specify files, "all", "coverage", or "e2e"
allowed-tools: Bash(pnpm:*), Bash(export:*)
---

# Test Runner

Run the appropriate tests based on the user's request: $ARGUMENTS

**Shell prefix (required):**
```
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
```

## Rules

1. **Specific file(s) or pattern provided** → Run only those tests:
   ```
   pnpm exec vitest run <pattern> --passWithNoTests
   ```

2. **"all" or no arguments** → Run full test suite:
   ```
   pnpm test
   ```

3. **"coverage"** → Run with coverage report:
   ```
   pnpm exec vitest run --coverage
   ```

4. **"e2e"** → Run Playwright end-to-end tests:
   ```
   pnpm test:e2e
   ```

## Output

After running, report:
- Total tests: pass/fail/skip counts
- If failures: show the failure messages and file locations
- If all pass: confirm with one-line summary
