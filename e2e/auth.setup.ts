import { test as setup, expect } from '@playwright/test'
import path from 'path'

const authFile = path.join(__dirname, '.auth/user.json')

/** Fill whatever input the current exercise renders and click Submit. */
async function fillAndSubmit(page: import('@playwright/test').Page) {
  const submit = page.getByRole('button', { name: /^submit$/i })

  // 1. Inline gap_fill blanks — aria-label "Your answer" or "Blank N"
  const inlineBlank = page.locator('input[aria-label]').first()
  if (await inlineBlank.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await inlineBlank.fill('hola')
    // Fill remaining blanks if multi-blank
    const allBlanks = page.locator('input[aria-label]')
    const count = await allBlanks.count()
    for (let i = 1; i < count; i++) {
      await allBlanks.nth(i).fill('hola')
    }
  }

  // 2. Standalone gap_fill — placeholder "Type your answer…"
  const standaloneInput = page.locator('input[placeholder="Type your answer…"]')
  if (await standaloneInput.isVisible({ timeout: 1_000 }).catch(() => false)) {
    await standaloneInput.fill('hola')
  }

  // 3. Textarea (translation, transformation, error_correction)
  const textarea = page.locator('textarea').first()
  if (await textarea.isVisible({ timeout: 1_000 }).catch(() => false)) {
    await textarea.fill('hola')
  }

  // 4. SentenceBuilder word chips — click first available chip from the word bank
  if (!await submit.isEnabled({ timeout: 500 }).catch(() => false)) {
    // Gray chip buttons are type="button" with a specific bg class; submit is type="submit"
    const chip = page.locator('button[type="button"]:not([disabled])').first()
    if (await chip.isVisible({ timeout: 1_000 }).catch(() => false)) {
      await chip.click()
    }
  }

  await submit.click()
}

setup('authenticate', async ({ page }) => {
  await page.goto('/auth/login')
  await page.fill('#email', process.env.E2E_EMAIL!)
  await page.fill('#password', process.env.E2E_PASSWORD!)
  await page.click('button:has-text("Sign in")')

  // Login may redirect to /onboarding (incomplete) or /dashboard (complete)
  await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 15_000 })

  // If redirected to onboarding, complete all diagnostic exercises via UI
  if (page.url().includes('/onboarding')) {
    for (let i = 0; i < 10; i++) {
      // Fill and submit current exercise (handles all exercise types)
      await fillAndSubmit(page)

      // Wait for feedback / advance button (grading takes a few seconds)
      const advanceBtn = page.getByRole('button', {
        name: /next →|finish diagnostic/i,
      })
      await advanceBtn.waitFor({ timeout: 30_000 })
      await advanceBtn.click()

      // Stop as soon as we land on the dashboard
      try {
        await page.waitForURL('**/dashboard', { timeout: 5_000 })
        break
      } catch {
        // Still on onboarding — continue to next question
      }
    }
  }

  await expect(page).toHaveURL(/dashboard/, { timeout: 15_000 })
  await page.context().storageState({ path: authFile })
})
