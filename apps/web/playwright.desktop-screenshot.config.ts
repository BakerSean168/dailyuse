import { defineConfig } from '@playwright/test';
import { createApiServer } from './playwright.server';

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
  globalSetup: './e2e/helpers/desktop-build-global-setup.ts' // Residual 1041 sole,
  use: {
    actionTimeout: 15 * 1000,
    trace: 'retain-on-failure',
    screenshot: 'off',
    video: 'off',
  },
  webServer: [
    {
      ...createApiServer(),
    },
  ],
});
