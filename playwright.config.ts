import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2E test configuration.
 *
 * Tests run against the production build served by Vite preview — not the dev
 * server. This is intentional: it surfaces base-path bugs, build-time
 * optimisation issues, and anything that behaves differently in production.
 *
 * Base URL: http://localhost:4173/lexio/ (matches the Vite base path in
 * vite.config.ts and the GitHub Pages deployment path).
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',

  use: {
    baseURL: 'http://localhost:4173/lexio/',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Build once and serve with vite preview before the test suite runs.
  // The webServer is shared across all workers — the build is not repeated per
  // worker. The `reuseExistingServer` flag allows running against a preview
  // server that is already up (e.g. during local development).
  webServer: {
    command: 'npm run build && npx vite preview --port 4173',
    url: 'http://localhost:4173/lexio/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
