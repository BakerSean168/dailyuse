import { defineConfig } from '@playwright/test';

/**
 * Electron shell geometry smoke.
 * Guest-mode only; no API/webServer dependency.
 */
export default defineConfig({
  testDir: './e2e/shell',
  timeout: 3 * 60 * 1000,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  expect: {
    timeout: 20_000,
  },
  // Always keep the HTML reporter non-interactive so agent/CI runs do not hang.
  reporter: [
    ['html', { outputFolder: 'playwright-shell-report', open: 'never' }],
    ['list'],
  ],
  globalSetup: './e2e/shell/global-setup.ts',
  use: {
    actionTimeout: 15_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },
});
