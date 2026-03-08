import { test as setup, expect } from '@playwright/test'
import path from 'path'

const authFile = path.join(__dirname, '.auth/user.json')

setup('authenticate', async ({ page }) => {
  await page.goto('/auth/login')
  await page.fill('#email', process.env.E2E_EMAIL!)
  await page.fill('#password', process.env.E2E_PASSWORD!)
  await page.click('button:has-text("Sign in")')
  await page.waitForURL('**/dashboard', { timeout: 15_000 })
  await page.context().storageState({ path: authFile })
})
