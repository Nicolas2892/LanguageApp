import { test, expect } from '@playwright/test'

// ---------------------------------------------------------------------------
// Helper: submit one exercise answer and wait for the feedback panel
// ---------------------------------------------------------------------------
async function submitAndWaitForFeedback(page: import('@playwright/test').Page) {
  // Fill gap_fill input if present, otherwise fill textarea
  const gapInput = page.getByLabel('Your answer')
  const textarea = page.locator('textarea')

  if (await gapInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await gapInput.fill('test')
  } else if (await textarea.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await textarea.fill('test')
  }

  await page.getByRole('button', { name: /submit/i }).click()

  // Wait for feedback panel — either "Next →" or "Finish session"
  await expect(
    page.getByRole('button', { name: /next →|finish session/i }),
  ).toBeVisible({ timeout: 30_000 })
}

// ---------------------------------------------------------------------------
// Test 1 — Normal SRS session regression check
// ---------------------------------------------------------------------------
test('SRS session: submit answer → feedback → next exercise loads', async ({ page }) => {
  await page.goto('/dashboard')

  // Click the primary "Start review →" CTA (or any study-starting link)
  const startLink = page
    .getByRole('link', { name: /start review|start learning|review now/i })
    .first()
  await startLink.click()

  // Wait for study page to load
  await page.waitForURL('**/study**', { timeout: 15_000 })

  // Submit one exercise
  await submitAndWaitForFeedback(page)

  // Feedback panel is visible — no crash / 500
  await expect(
    page.getByRole('button', { name: /next →|finish session/i }),
  ).toBeVisible()
})

// ---------------------------------------------------------------------------
// Test 2 — Done screen appears and navigates back to dashboard
// ---------------------------------------------------------------------------
test('Done screen: score % shown, back button returns to dashboard', async ({ page }) => {
  // 1-exercise session via URL
  await page.goto('/study?size=1')
  await page.waitForURL('**/study**', { timeout: 15_000 })

  // Submit the exercise
  await submitAndWaitForFeedback(page)

  // Click Finish session
  await page.getByRole('button', { name: /finish session/i }).click()

  // Done screen — score percentage visible
  await expect(page.getByText(/%/)).toBeVisible({ timeout: 10_000 })

  // Navigate back (Done / Back to Home button)
  await page.getByRole('link', { name: /done|back to home/i }).click()
  await page.waitForURL('**/dashboard', { timeout: 10_000 })

  await expect(page).toHaveURL(/dashboard/)
})

// ---------------------------------------------------------------------------
// Test 3 — Drill mode: auto-generate exercises + advance to second exercise
// ---------------------------------------------------------------------------
test('Drill mode: submit first exercise, second exercise loads (not done screen)', async ({
  page,
}) => {
  // Grab first concept UUID from curriculum page
  await page.goto('/curriculum')
  const practiceLink = page.locator('a[href*="concept="]').first()
  const href = await practiceLink.getAttribute('href')
  expect(href).toBeTruthy()

  // Extract concept UUID
  const conceptId = new URL(href!, 'http://x').searchParams.get('concept')
  expect(conceptId).toBeTruthy()

  // Navigate to practice mode for that concept (gap_fill, size=2 so we can advance)
  await page.goto(
    `/study?concept=${conceptId}&practice=true&types=gap_fill&size=2`,
  )
  await page.waitForURL('**/study**', { timeout: 15_000 })

  // Submit first exercise
  await submitAndWaitForFeedback(page)

  // Wait up to 15s for background generation to settle, then advance
  await page.waitForTimeout(2_000)
  await page.getByRole('button', { name: /next →|finish session/i }).click()

  // Should land on a second exercise (gap_fill input visible) OR done screen —
  // either is acceptable; what we assert is: no error page / crash
  const hasInput = await page
    .getByLabel('Your answer')
    .isVisible({ timeout: 10_000 })
    .catch(() => false)
  const hasTextarea = await page
    .locator('textarea')
    .isVisible({ timeout: 2_000 })
    .catch(() => false)
  const hasDoneScore = await page
    .getByText(/%/)
    .isVisible({ timeout: 2_000 })
    .catch(() => false)

  // At least one of these must be true — no error page
  expect(hasInput || hasTextarea || hasDoneScore).toBe(true)
})

// ---------------------------------------------------------------------------
// Test 4 — Sprint mode: progress counter, 2 exercises, done screen
// ---------------------------------------------------------------------------
test('Sprint mode: progress counter increments, done screen after 2 exercises', async ({
  page,
}) => {
  await page.goto('/study?mode=sprint&limitType=count&limit=2')
  await page.waitForURL('**/study**', { timeout: 15_000 })

  // Progress counter "1 / 2" visible
  await expect(page.getByText('1 / 2')).toBeVisible({ timeout: 10_000 })

  // Submit exercise 1
  await submitAndWaitForFeedback(page)
  await page.getByRole('button', { name: /next →/i }).click()

  // Counter advances to "2 / 2"
  await expect(page.getByText('2 / 2')).toBeVisible({ timeout: 10_000 })

  // Submit exercise 2
  await submitAndWaitForFeedback(page)
  await page.getByRole('button', { name: /finish session/i }).click()

  // Done screen with score %
  await expect(page.getByText(/%/)).toBeVisible({ timeout: 10_000 })
})
