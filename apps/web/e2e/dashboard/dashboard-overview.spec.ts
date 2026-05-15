/**
 * Dashboard Overview E2E Test
 *
 * Current web shell contract:
 * - `/` is the welcome page
 * - `/dashboard` is the authenticated dashboard
 * - app navigation is button-based inside MainLayout
 */
import { test, expect } from '@playwright/test';
import { login, TEST_USER } from '../helpers/testHelpers';
import { WEB_CONFIG, TIMEOUT_CONFIG } from '../config';

const DASHBOARD_STAT_CARDS = [
  'dashboard-stat-card-active-tasks',
  'dashboard-stat-card-completed-today',
  'dashboard-stat-card-active-goals',
  'dashboard-stat-card-upcoming-reminders',
  'dashboard-stat-card-unread-notifications',
  'dashboard-stat-card-schedule-conflicts',
] as const;

test.describe('Dashboard Overview', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USER.username, TEST_USER.password);
  });

  test('[P0] should load Dashboard page successfully', async ({ page }) => {
    await page.goto(WEB_CONFIG.DASHBOARD_PATH, {
      waitUntil: 'networkidle',
      timeout: TIMEOUT_CONFIG.NAVIGATION,
    });

    await expect(page).toHaveURL(new RegExp(`${WEB_CONFIG.DASHBOARD_PATH}$`));
    await expect(page.getByTestId('dashboard-view')).toBeVisible();

    const errorMessage = page.locator('text=/错误|Error|失败|Failed/i');
    const hasError = await errorMessage.isVisible().catch(() => false);
    expect(hasError).toBe(false);
  });

  test('[P0] should set correct page title', async ({ page }) => {
    await page.goto(WEB_CONFIG.DASHBOARD_PATH, { waitUntil: 'networkidle' });

    await expect(page).toHaveTitle(/仪表盘|Dashboard/);
    await expect(page).toHaveTitle(/Memoflow/);
  });

  test('[P0] should display Dashboard in navigation menu', async ({ page }) => {
    await page.goto(WEB_CONFIG.DASHBOARD_PATH, { waitUntil: 'networkidle' });

    await expect(page.getByTestId('main-nav-dashboard')).toBeVisible();
  });

  test('[P0] should require authentication', async ({ page, context }) => {
    await context.clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    await page.goto(WEB_CONFIG.DASHBOARD_PATH, { waitUntil: 'networkidle' });
    await page.waitForURL(`**${WEB_CONFIG.LOGIN_PATH}**`, {
      timeout: TIMEOUT_CONFIG.NAVIGATION,
    });

    expect(page.url()).toContain(WEB_CONFIG.LOGIN_PATH);
  });

  test('[P0] should display main statistics', async ({ page }) => {
    await page.goto(WEB_CONFIG.DASHBOARD_PATH, { waitUntil: 'networkidle' });
    await expect(page.getByTestId('dashboard-view')).toBeVisible();

    for (const cardId of DASHBOARD_STAT_CARDS) {
      await expect(page.getByTestId(cardId)).toBeVisible();
    }
  });

  test('[P1] should have responsive layout', async ({ page }) => {
    await page.goto(WEB_CONFIG.DASHBOARD_PATH, { waitUntil: 'networkidle' });

    const firstCard = page.getByTestId(DASHBOARD_STAT_CARDS[0]);

    await page.setViewportSize({ width: 375, height: 667 });
    await expect(firstCard).toBeVisible();

    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(firstCard).toBeVisible();

    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(firstCard).toBeVisible();
  });

  test('[P1] should navigate to Dashboard from other pages', async ({ page }) => {
    await page.goto(WEB_CONFIG.TASKS_PATH, { waitUntil: 'networkidle' });

    await page.getByTestId('main-nav-dashboard').click();
    await page.waitForURL(`**${WEB_CONFIG.DASHBOARD_PATH}`, {
      timeout: TIMEOUT_CONFIG.NAVIGATION,
    });

    await expect(page.getByTestId('dashboard-view')).toBeVisible();
  });

  test('[P2] should expose stable main navigation order', async ({ page }) => {
    await page.goto(WEB_CONFIG.DASHBOARD_PATH, { waitUntil: 'networkidle' });

    const navButtons = page.locator('[data-testid^="main-nav-"]');
    await expect(navButtons.first()).toHaveAttribute('data-testid', 'main-nav-home');
    await expect(navButtons.nth(1)).toHaveAttribute('data-testid', 'main-nav-dashboard');
  });

  test('[P1] should display settings navigation button', async ({ page }) => {
    await page.goto(WEB_CONFIG.DASHBOARD_PATH, { waitUntil: 'networkidle' });

    await expect(page.getByTestId('bottom-nav-settings')).toBeVisible();
  });

  test('[P1] should display refresh button', async ({ page }) => {
    await page.goto(WEB_CONFIG.DASHBOARD_PATH, { waitUntil: 'networkidle' });

    const refreshButton = page.getByTestId('dashboard-refresh-button');
    await expect(refreshButton).toBeVisible();
    await refreshButton.click();

    await expect(page.getByTestId('dashboard-view')).toBeVisible();
  });

  test('[P2] should support keyboard navigation', async ({ page }) => {
    await page.goto(WEB_CONFIG.DASHBOARD_PATH, { waitUntil: 'networkidle' });

    await page.keyboard.press('Tab');

    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible({ timeout: 2000 });
  });

  test('[P2] should maintain state after browser refresh', async ({ page }) => {
    await page.goto(WEB_CONFIG.DASHBOARD_PATH, { waitUntil: 'networkidle' });

    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.getByTestId('dashboard-stat-card-active-tasks')).toBeVisible();
  });

  test('[P1] should handle network errors gracefully', async ({ page }) => {
    await page.goto(WEB_CONFIG.DASHBOARD_PATH, { waitUntil: 'networkidle' });
    await expect(page.getByTestId('dashboard-view')).toBeVisible();

    await page.context().setOffline(true);
    await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
    await page.context().setOffline(false);

    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.getByTestId('dashboard-view')).toBeVisible();
    await expect(page.getByTestId(DASHBOARD_STAT_CARDS[0])).toBeVisible();
  });
});
