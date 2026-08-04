/**
 * Dashboard Retirement E2E Test (UI redesign V2)
 *
 * V2 shell contract (docs/UI_REDESIGN_V2_PLAN.md §3):
 * - Dashboard is retired: `/dashboard` redirects to `/` (AI workspace ground)
 * - `/` renders the persistent AI layer inside the AppShell
 * - the window header exposes one workspace launcher; business context lives
 *   in BusinessPanel tabs instead of a second module-navigation surface
 */
import { test, expect } from '@playwright/test';
import { login } from '../helpers/testHelpers';
import { WEB_CONFIG, TIMEOUT_CONFIG, TEST_USERS } from '../config';

test.describe('Dashboard retirement (V2 shell)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.MAIN.username, TEST_USERS.MAIN.password);
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

  test('[P0] should expose one workspace launcher without legacy module capsules', async ({
    page,
  }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page.getByTestId('shell-workspace-launcher')).toBeVisible();
    await expect(page.locator('[data-testid^="capsule-nav-"]')).toHaveCount(0);
  });

  test('[P1] should show panel Home by default and return there from a business tab', async ({
    page,
  }) => {
    await page.goto('/goals', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('business-panel')).toBeVisible();
    await expect(page.getByTestId('goal-list-view')).toBeVisible();

    await page.getByTestId('business-panel-home').click();
    await expect(page.getByTestId('today-overview-panel')).toBeVisible();
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

  test('[P2] should preserve a business tab and hidden-panel preference across reload', async ({
    page,
  }) => {
    await page.goto('/goals', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('business-panel')).toBeVisible();

    await page.getByTestId('business-panel-close').click();
    await expect(page).toHaveURL(/\/goals$/);
    await expect(page.getByTestId('business-panel')).toBeHidden();
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('business-panel')).toBeHidden();

    await page.getByTestId('shell-right-panel-toggle').click();
    await expect(page.getByTestId('business-panel')).toBeVisible();
    await expect(page.getByTestId('ai-chat-view')).toBeVisible();
  });

  test('[P2] should return to panel Home after closing the final business tab', async ({
    page,
  }) => {
    await page.goto('/goals', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('business-panel-tab-close').click();

    await page.waitForURL(/\/$/, { timeout: TIMEOUT_CONFIG.NAVIGATION });
    await expect(page.getByTestId('business-panel')).toBeVisible();
    await expect(page.getByTestId('today-overview-panel')).toBeVisible();
  });
});
