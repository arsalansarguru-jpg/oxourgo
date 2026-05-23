import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3005'

/**
 * Smoke tests assume `NEXT_PUBLIC_SUPABASE_*` is set so `/dashboard` and `/admin`
 * go through auth middleware (not the config-unavailable path).
 */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : [['list']],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], channel: 'chrome' } }],
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : {
        command: process.env.PLAYWRIGHT_WEB_SERVER ?? 'npx next start -p 3005',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
        cwd: __dirname,
        stdout: 'pipe',
        stderr: 'pipe',
      },
})
