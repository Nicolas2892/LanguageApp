import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000, // Claude grading can take 5-6s; give plenty of headroom
  retries: 1, // one retry on flake
  reporter: 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [
    // Auth setup runs first — no storageState (file doesn't exist yet)
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    // All smoke tests depend on auth setup and load the saved session
    {
      name: 'chromium',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
      },
    },
  ],
})
