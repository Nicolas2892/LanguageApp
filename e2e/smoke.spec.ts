import { test, expect } from '@playwright/test'

// ---------------------------------------------------------------------------
// Shared state: one real concept UUID fetched from the curriculum page once.
// Using concept practice mode makes all session tests independent of SRS state.
// ---------------------------------------------------------------------------
let CONCEPT_ID: string

test.beforeAll(async ({ browser }) => {
  // Must pass storageState so the unauthenticated middleware doesn't block /curriculum
  const context = await browser.newContext({
    storageState: 'e2e/.auth/user.json',
  })
  const page = await context.newPage()
  await page.goto('/curriculum')
  const link = page.locator('a[href*="concept="]').first()
  const href = await link.getAttribute('href')
  expect(href).toBeTruthy()
  CONCEPT_ID = new URL(href!, 'http://x').searchParams.get('concept')!
  expect(CONCEPT_ID).toBeTruthy()
  await context.close()
})

// ---------------------------------------------------------------------------
// Dismiss the OnboardingTour and push notification prompt before every test.
// addInitScript runs before React hydrates, so localStorage is set in time.
// ---------------------------------------------------------------------------
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('tour_dismissed', '1')
    localStorage.setItem('push_prompt_dismissed', '1')
  })
})

// ---------------------------------------------------------------------------
// Helper: fill whatever input the current exercise renders, then click Submit.
//
// Handles all exercise types:
//   - gap_fill inline: input[aria-label] (blanks embedded in text)
//   - gap_fill standalone: input[placeholder="Type your answer…"] (no aria-label)
//   - translation / transformation / error_correction: textarea
//   - sentence_builder: form-scoped chip buttons (word bank)
//     NOTE: we scope to `form button` to avoid clicking the "Exit session"
//     header button which has type="button" but is outside the exercise form.
// ---------------------------------------------------------------------------
async function submitAndWaitForFeedback(page: import('@playwright/test').Page) {
  const submit = page.getByRole('button', { name: /^submit$/i })

  // 1. Inline gap_fill blanks — aria-label "Your answer" or "Blank N"
  const inlineBlank = page.locator('input[aria-label]').first()
  if (await inlineBlank.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await inlineBlank.fill('hola')
    const allBlanks = page.locator('input[aria-label]')
    const count = await allBlanks.count()
    for (let i = 1; i < count; i++) {
      await allBlanks.nth(i).fill('hola')
    }
  }

  // 2. Standalone gap_fill — placeholder "Type your answer…" (no aria-label)
  const standaloneInput = page.locator('input[placeholder="Type your answer…"]')
  if (await standaloneInput.isVisible({ timeout: 1_000 }).catch(() => false)) {
    await standaloneInput.fill('hola')
  }

  // 3. Textarea (translation, transformation, error_correction)
  const textarea = page.locator('textarea').first()
  if (await textarea.isVisible({ timeout: 1_000 }).catch(() => false)) {
    await textarea.fill('hola')
  }

  // 4. SentenceBuilder word-bank chip — scope to `form` to avoid hitting
  //    the "Exit session" button that also has type="button" in the header.
  if (!await submit.isEnabled({ timeout: 500 }).catch(() => false)) {
    const chip = page.locator('form button[type="button"]:not([disabled])').first()
    if (await chip.isVisible({ timeout: 1_000 }).catch(() => false)) {
      await chip.click()
    }
  }

  // Debug screenshot if submit is still disabled
  if (!await submit.isEnabled({ timeout: 500 }).catch(() => false)) {
    await page.screenshot({ path: 'test-results/debug-submit-disabled.png', fullPage: true })
  }

  await submit.click()

  // Wait for feedback panel
  await expect(
    page.getByRole('button', { name: /next →|finish session/i }),
  ).toBeVisible({ timeout: 30_000 })
}

// ---------------------------------------------------------------------------
// Test 1 — Submit an exercise and see feedback (concept practice mode)
// ---------------------------------------------------------------------------
test('Exercise session: submit answer → feedback panel appears', async ({ page }) => {
  await page.goto(`/study?concept=${CONCEPT_ID}&practice=true&types=gap_fill&size=3`)
  await page.waitForURL('**/study**', { timeout: 15_000 })

  await submitAndWaitForFeedback(page)

  await expect(
    page.getByRole('button', { name: /next →|finish session/i }),
  ).toBeVisible()
})

// ---------------------------------------------------------------------------
// Test 2 — Done screen: score % shown after exactly 1 exercise
// Uses concept mode WITHOUT practice=true to avoid drill auto-generation
// expanding the session dynamically (which changes "Finish session" → "Next →").
// ---------------------------------------------------------------------------
test('Done screen: score % shown after finishing 1-exercise session', async ({ page }) => {
  // No practice=true → no auto-generation → exactly 1 exercise served
  await page.goto(`/study?concept=${CONCEPT_ID}&size=1`)
  await page.waitForURL('**/study**', { timeout: 15_000 })

  await submitAndWaitForFeedback(page)

  // With exactly 1 exercise, the button must say "Finish session"
  await page.getByRole('button', { name: /finish session/i }).click()

  // Done screen — score percentage visible
  await expect(page.getByText(/%/)).toBeVisible({ timeout: 10_000 })
})

// ---------------------------------------------------------------------------
// Test 3 — Drill mode: auto-generate + advance to second exercise
// ---------------------------------------------------------------------------
test('Drill mode: submit first exercise, page loads next exercise without error', async ({
  page,
}) => {
  await page.goto(
    `/study?concept=${CONCEPT_ID}&practice=true&types=gap_fill&size=2`,
  )
  await page.waitForURL('**/study**', { timeout: 15_000 })

  await submitAndWaitForFeedback(page)

  // Wait for background generation to settle
  await page.waitForTimeout(2_000)
  await page.getByRole('button', { name: /next →|finish session/i }).click()

  // Either a second exercise or done screen — no crash / error page
  const hasInput = await page
    .locator('input[aria-label]')
    .isVisible({ timeout: 10_000 })
    .catch(() => false)
  const hasStandaloneInput = await page
    .locator('input[placeholder="Type your answer…"]')
    .isVisible({ timeout: 2_000 })
    .catch(() => false)
  const hasTextarea = await page
    .locator('textarea')
    .isVisible({ timeout: 2_000 })
    .catch(() => false)
  const hasDoneScore = await page
    .getByText(/%/)
    .isVisible({ timeout: 2_000 })
    .catch(() => false)

  expect(hasInput || hasStandaloneInput || hasTextarea || hasDoneScore).toBe(true)
})

// ---------------------------------------------------------------------------
// Test 4 — Short study session: 2-exercise session ends at done screen
// Uses concept mode WITHOUT practice=true to avoid drill auto-generation
// so the session is exactly 2 exercises and the done screen is predictable.
// ---------------------------------------------------------------------------
test('2-exercise session: progress counter shown, done screen after completing both', async ({
  page,
}) => {
  // No practice=true → no auto-generation → exactly 2 exercises served
  await page.goto(`/study?concept=${CONCEPT_ID}&size=2`)
  await page.waitForURL('**/study**', { timeout: 15_000 })

  // Progress counter visible (e.g. "1 / 2")
  await expect(page.getByText(/\d+ \/ \d+/)).toBeVisible({ timeout: 10_000 })

  // Exercise 1 → Next →
  await submitAndWaitForFeedback(page)
  await page.getByRole('button', { name: /next →/i }).click()

  // Exercise 2 → Finish session
  await submitAndWaitForFeedback(page)
  await page.getByRole('button', { name: /finish session/i }).click()

  // Done screen with score %
  await expect(page.getByText(/%/)).toBeVisible({ timeout: 10_000 })
})
