import { defineConfig, devices } from '@playwright/test';
import { createApiServer, createWebServer, getE2EWebOrigin } from './playwright.server';

export default defineConfig({
  // 调试/探索脚本保留在单独入口，避免污染默认业务回归。
  testDir: './e2e',
  testMatch: [
    '**/debug/**/*.spec.ts',
    '**/debug*.spec.ts',
    '**/*-debug.spec.ts',
    '**/explore*.spec.ts',
    '**/check-route.spec.ts',
  ],
  timeout: 5 * 60 * 1000,
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: process.env.CI
    ? [
        ['html', { outputFolder: 'playwright-debug-report', open: 'never' }],
        ['list'],
      ]
    : [['html', { outputFolder: 'playwright-debug-report' }], ['list']],
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
      name: 'debug-chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [createApiServer(), createWebServer()],
});
