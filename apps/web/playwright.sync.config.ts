import { defineConfig, devices } from '@playwright/test';
import { createApiServer, createWebServer, getE2EWebOrigin } from './playwright.server';

export default defineConfig({
  testDir: './e2e/sync',
  timeout: 5 * 60 * 1000,
  // Sync 回归会同时驱动 API、Web 和 desktop，串行执行更容易定位跨端状态问题。
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  expect: {
    timeout: 30 * 1000,
  },
  reporter: process.env.CI
    ? [
        ['html', { outputFolder: 'playwright-sync-report', open: 'never' }],
        ['json', { outputFile: 'test-results/sync-results.json' }],
        ['list'],
        ['github'],
      ]
    : [
        ['html', { outputFolder: 'playwright-sync-report' }],
        ['json', { outputFile: 'test-results/sync-results.json' }],
        ['list'],
      ],
  // 先准备 desktop 可执行入口，避免每个用例重复 build。
  globalSetup: './e2e/sync/global-setup.ts',
  use: {
    baseURL: getE2EWebOrigin(),
    trace: 'on',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: { width: 1440, height: 900 },
    actionTimeout: 15 * 1000,
  },
  projects: [
    {
      name: 'sync-chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // 先拉起 API，再拉起依赖该 API 的 Web dev server。这样 sync 用例和开发时
  // 通过代理访问后端的路径保持一致。
  webServer: [
    {
      ...createApiServer(),
    },
    {
      ...createWebServer(),
    },
  ],
});
