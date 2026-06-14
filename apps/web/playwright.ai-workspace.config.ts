import { defineConfig, devices } from '@playwright/test';
import { createWebServer } from './playwright.server';

// `web:e2e:ai-workspace` starts Vite outside Playwright on Windows to avoid
// flaky webServer teardown; keep the opt-in switch for direct config usage.
const shouldManageWebServer = process.env.PLAYWRIGHT_DISABLE_WEBSERVER !== 'true';

export default defineConfig({
  testDir: './e2e',
  testMatch: ['**/ai/goal-workflow.spec.ts'],
  timeout: 5 * 60 * 1000,
  expect: {
    timeout: 10 * 1000,
  },
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI
    ? [
        ['html', { outputFolder: 'playwright-ai-workspace-report', open: 'always' }],
        ['json', { outputFile: 'test-results/ai-workspace-results.json' }],
        ['list'],
        ['github'],
      ]
    : [
        ['html', { outputFolder: 'playwright-ai-workspace-report' }],
        ['list'],
        ['json', { outputFile: 'test-results/ai-workspace-results.json' }],
      ],
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'on',
    screenshot: 'on',
    video: 'on',
    viewport: { width: 1280, height: 720 },
    actionTimeout: 15 * 1000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // AI workspace flows are HTTP-mocked inside the spec, so they only need the Vite app.
  webServer: shouldManageWebServer ? [createWebServer('http://127.0.0.1:5173/')] : undefined,
});
