import { defineConfig, devices } from '@playwright/test';
import {
  createRealOAuthApiServer,
  createWebServer,
  getE2EWebOrigin,
} from './playwright.server';

/**
 * Residual 1339: real-provider GitHub OAuth only.
 * Separate from default playwright.config.ts (e2e-mock lane).
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: ['**/authentication/auth-oauth-real.spec.ts'],
  timeout: 6 * 60 * 1000,
  expect: { timeout: 15 * 1000 },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [['list'], ['json', { outputFile: 'test-results/oauth-real-results.json' }]],
  use: {
    baseURL: getE2EWebOrigin(),
    headless: false,
    trace: 'on',
    screenshot: 'on',
    video: 'on',
    viewport: { width: 1280, height: 720 },
    actionTimeout: 30 * 1000,
  },
  projects: [
    {
      name: 'chromium-headed-real-oauth',
      use: { ...devices['Desktop Chrome'], headless: false },
    },
  ],
  webServer: [createRealOAuthApiServer(), createWebServer()],
});
