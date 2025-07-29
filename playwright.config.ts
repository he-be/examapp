import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for E2E testing with Cloudflare Workers
 * Uses wrangler dev to serve the application locally
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: process.env.CI ? 60000 : 30000, // CI環境では1分、ローカルでは30秒

  use: {
    baseURL: 'http://localhost:8787',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // CI環境での追加設定
    ...(process.env.CI && {
      video: 'retain-on-failure',
      headless: true,
    }),
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:8787',
    reuseExistingServer: !process.env.CI,
    timeout: process.env.CI ? 120000 : 60000, // CI環境では2分、ローカルでは1分
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
