import { defineConfig } from '@playwright/test';

const apiOrigin = process.env.E2E_API_BASE_URL ?? 'http://127.0.0.1:3000';
process.env.E2E_API_BASE_URL ??= apiOrigin;
process.env.E2E_API_FULL_URL ??= `${apiOrigin.replace(/\/+$/, '')}/api/v1`;

export default defineConfig({
  testDir: './e2e/desktop-screenshots',
  timeout: 5 * 60 * 1000,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  expect: {
    timeout: 30 * 1000,
  },
  reporter: process.env.CI
    ? [
        ['html', { outputFolder: 'playwright-desktop-screenshot-report', open: 'never' }],
        ['list'],
      ]
    : [['html', { outputFolder: 'playwright-desktop-screenshot-report' }], ['list']],
  globalSetup: './e2e/desktop-screenshots/global-setup.ts',
  use: {
    actionTimeout: 15 * 1000,
    trace: 'retain-on-failure',
    screenshot: 'off',
    video: 'off',
  },
  webServer: [
    {
      command: 'pnpm nx serve api',
      url: `${apiOrigin}/healthz`,
      reuseExistingServer: !process.env.CI,
      timeout: 300 * 1000,
    },
  ],
});
