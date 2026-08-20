/**
 * Dashboard Retirement E2E Test (UI redesign V2)
 *
 * V2 shell contract (docs/UI_REDESIGN_V2_PLAN.md §3):
 * - Dashboard is retired: `/dashboard` redirects to `/` (AI workspace ground)
 * - `/` renders the persistent AI layer inside the AppShell
 * - the window header exposes explicit compound module capsules without a redundant workspace launcher;
 *   business context remains in BusinessPanel tabs
 */
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../helpers/testHelpers';
import { WEB_CONFIG, TIMEOUT_CONFIG } from '../config';

test.describe('Dashboard retirement (V2 shell)', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page);
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

  test('[P0] should expose explicit module capsules without a workspace launcher', async ({
    page,
  }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page.getByTestId('shell-workspace-launcher')).toHaveCount(0);
    await expect(page.getByTestId('capsule-nav-goal')).toBeVisible();
    await expect(page.getByTestId('capsule-nav-task')).toBeVisible();
    await expect(page.getByTestId('capsule-nav-schedule')).toBeVisible();
    await expect(page.getByTestId('capsule-nav-notification')).toBeVisible();
  });

  test('[P1] should show panel Home by default and return there from a business tab', async ({
    page,
  }) => {
    await page.goto('/goals', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('business-panel')).toBeVisible();
    await expect(page.getByTestId('goal-list-view')).toBeVisible();

    await page.getByTestId('business-panel-home').click();
    await expect(page.getByTestId('today-overview-panel')).toBeVisible();
    await expect(page.getByTestId('business-panel-focus-toggle')).toBeVisible();
    await expect(page.getByTestId('business-panel-close')).toHaveCount(0);
  });

  test('[P1] should keep legacy deep-link redirects working', async ({ page }) => {
    await page.goto('/ai/chat', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId('ai-chat-view')).toBeVisible();

    // Account center redirects into standalone Settings (STATE D), not BusinessPanel.
    await page.goto('/account/center', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/settings\?tab=account$/);
    await expect(page.getByTestId('standalone-settings-layout')).toBeVisible();
    await expect(page.getByTestId('settings-scene-rail')).toHaveCount(0);
    await expect(page.getByTestId('settings-return-to-app')).toBeVisible();
    await expect(page.getByTestId('window-header')).toHaveAttribute('data-header-mode', 'settings');
    const returnButtonBox = await page.getByTestId('settings-return-to-app').boundingBox();
    expect(returnButtonBox?.y ?? Number.POSITIVE_INFINITY).toBeLessThan(48);
  });

  test('[P2] should preserve a business tab and hidden-panel preference across reload', async ({
    page,
  }) => {
    await page.goto('/goals', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('business-panel')).toBeVisible();

    await page.getByTestId('shell-right-panel-toggle').click();
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
