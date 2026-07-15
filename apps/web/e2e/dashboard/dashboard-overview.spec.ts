/**
 * Dashboard Retirement E2E Test (UI redesign V2)
 *
 * V2 shell contract (docs/UI_REDESIGN_V2_PLAN.md §3):
 * - Dashboard is retired: `/dashboard` redirects to `/` (AI workspace ground)
 * - `/` renders the persistent AI layer inside the AppShell
 * - top-of-window capsule navigation replaces the V1 grouped sidebar
 *   (`capsule-nav-*` testids replace `main-nav-*` / `bottom-nav-*`)
 */
import { test, expect } from '@playwright/test';
import { login, TEST_USER } from '../helpers/testHelpers';
import { WEB_CONFIG, TIMEOUT_CONFIG } from '../config';

const CAPSULE_TESTIDS = [
  'capsule-nav-goal',
  'capsule-nav-task',
  'capsule-nav-note',
  'capsule-nav-reminder',
  'capsule-nav-notification',
] as const;

test.describe('Dashboard retirement (V2 shell)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USER.username, TEST_USER.password);
  });

  test('[P0] should redirect /dashboard to the AI workspace ground', async ({ page }) => {
    await page.goto(WEB_CONFIG.DASHBOARD_PATH, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUT_CONFIG.NAVIGATION,
    });

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId('ai-chat-view')).toBeVisible();
  });

  test('[P0] should require authentication', async ({ page, context }) => {
    await context.clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    await page.goto(WEB_CONFIG.DASHBOARD_PATH, { waitUntil: 'domcontentloaded' });
    await page.waitForURL(`**${WEB_CONFIG.LOGIN_PATH}**`, {
      timeout: TIMEOUT_CONFIG.NAVIGATION,
    });

    expect(page.url()).toContain(WEB_CONFIG.LOGIN_PATH);
  });

  test('[P0] should expose the five module capsules in the window header', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    for (const testId of CAPSULE_TESTIDS) {
      await expect(page.getByTestId(testId)).toBeVisible();
    }
  });

  test('[P1] should open a business panel from a capsule preview', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await page.getByTestId('capsule-nav-goal').click();
    const enter = page.getByTestId('capsule-preview-enter-goal');
    if (await enter.count()) {
      await enter.click();
    } else {
      await page.getByRole('dialog').getByRole('button').click();
    }

    await page.waitForURL('**/goals', { timeout: TIMEOUT_CONFIG.NAVIGATION });
    await expect(page.getByTestId('business-panel')).toBeVisible();
  });

  test('[P1] should keep legacy deep-link redirects working', async ({ page }) => {
    await page.goto('/ai/chat', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId('ai-chat-view')).toBeVisible();

    // Account center redirects into standalone Settings (STATE D), not BusinessPanel.
    await page.goto('/account/center', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/settings\?tab=account$/);
    await expect(page.getByTestId('standalone-settings-layout')).toBeVisible();
    await expect(page.getByTestId('settings-scene-rail')).toBeVisible();
  });

  test('[P2] should return to STATE A when the panel is closed', async ({ page }) => {
    await page.goto('/goals', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('business-panel')).toBeVisible();

    await page.getByTestId('business-panel-close').click();
    await page.waitForURL(/\/$/, { timeout: TIMEOUT_CONFIG.NAVIGATION });
    await expect(page.getByTestId('business-panel')).toHaveCount(0);
    await expect(page.getByTestId('ai-chat-view')).toBeVisible();
  });
});
