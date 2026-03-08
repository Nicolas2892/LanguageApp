import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000, // Claude grading can take 5-6s; give plenty of headroom
  retries: 1, // one retry on flake
  reporter: 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL,
    storageState: 'e2e/.auth/user.json',
    trace: 'on-first-retry',
  },
  projects: [
    // Auth setup runs first, no storageState dependency
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
      use: { ...devices['Desktop Chrome'], storageState: undefined },
    },
    // All smoke tests depend on auth setup
    {
      name: 'chromium',
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
