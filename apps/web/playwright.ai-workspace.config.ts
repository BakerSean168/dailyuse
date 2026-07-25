import { defineConfig, devices } from '@playwright/test';
import { createApiServer, createWebServer, getE2EWebOrigin } from './playwright.server';

// `web:e2e:ai-workspace` starts Vite outside Playwright on Windows to avoid
// flaky webServer teardown; keep the opt-in switch for direct config usage.
// Residual 1337: when the external runner owns servers it sets
// PLAYWRIGHT_DISABLE_WEBSERVER=true and also starts the e2e API.
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
    baseURL: getE2EWebOrigin(),
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
  // Residual 1337: AI SSE is mocked in-spec, but bootstrap still uses real register/login.
  // When Playwright owns servers, start API + Web. The external runner owns both when disabled.
  webServer: shouldManageWebServer
    ? [createApiServer(), createWebServer(`${getE2EWebOrigin()}/`)]
    : undefined,
});
