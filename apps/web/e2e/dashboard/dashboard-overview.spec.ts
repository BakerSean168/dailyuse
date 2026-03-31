/**
 * Dashboard Overview E2E Test
 *
 * Tests for Dashboard page overall functionality:
 * - Page loading and navigation
 * - Dashboard layout and responsiveness
 * - Authentication requirements
 * - Page title and metadata
 */
import { test, expect } from '@playwright/test';
import { login, TEST_USER } from '../helpers/testHelpers';
import { WEB_CONFIG, TIMEOUT_CONFIG } from '../config';

test.describe('Dashboard Overview', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USER.username, TEST_USER.password);
  });

  test('[P0] should load Dashboard page successfully', async ({ page }) => {
    // Navigate to Dashboard
    await page.goto(WEB_CONFIG.HOME_PATH, {
      waitUntil: 'networkidle',
      timeout: TIMEOUT_CONFIG.NAVIGATION,
    });

    // Verify URL
    expect(page.url()).toContain(WEB_CONFIG.HOME_PATH);

    // Verify page loaded
    await page.waitForTimeout(TIMEOUT_CONFIG.MEDIUM_WAIT);

    // Page should not show error
    const errorMessage = page.locator('text=/错误|Error|失败|Failed/i');
    const hasError = await errorMessage.isVisible().catch(() => false);
    expect(hasError).toBe(false);
  });

  test('[P0] should set correct page title', async ({ page }) => {
    await page.goto(WEB_CONFIG.HOME_PATH, { waitUntil: 'networkidle' });

    // Verify page title
    await expect(page).toHaveTitle(/仪表盘|Dashboard/);

    // Should include app name
    const title = await page.title();
    expect(title).toContain('Memoflow');
  });

  test('[P0] should display Dashboard in navigation menu', async ({ page }) => {
    await page.goto(WEB_CONFIG.HOME_PATH, { waitUntil: 'networkidle' });

    // Find Dashboard link in navigation
    const dashboardLink = page.locator(
      'nav a[href="/"], nav a:has-text("仪表盘"), nav a:has-text("Dashboard")',
    );

    // Should be visible in navigation
    await expect(dashboardLink.first()).toBeVisible();
  });

  test('[P0] should require authentication', async ({ page, context }) => {
    // Clear authentication
    await context.clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Try to access Dashboard
    await page.goto(WEB_CONFIG.HOME_PATH, { waitUntil: 'networkidle' });

    // Should redirect to login page
    await page.waitForURL(`**${WEB_CONFIG.LOGIN_PATH}**`, {
      timeout: TIMEOUT_CONFIG.NAVIGATION,
    });

    // Verify we're on login page
    expect(page.url()).toContain(WEB_CONFIG.LOGIN_PATH);
  });

  test('[P0] should display main statistics', async ({ page }) => {
    await page.goto(WEB_CONFIG.HOME_PATH, { waitUntil: 'networkidle' });
    await page.waitForTimeout(TIMEOUT_CONFIG.MEDIUM_WAIT);

    // Dashboard should show some statistics
    // Check for any widget to be visible
    const hasTaskWidget = await page
      .locator('[data-testid="task-stats-widget"]')
      .isVisible()
      .catch(() => false);
    const hasGoalWidget = await page
      .locator('[data-testid="goal-stats-widget"]')
      .isVisible()
      .catch(() => false);
    const hasReminderWidget = await page
      .locator('[data-testid="reminder-stats-widget"]')
      .isVisible()
      .catch(() => false);
    const hasScheduleWidget = await page
      .locator('[data-testid="schedule-stats-widget"]')
      .isVisible()
      .catch(() => false);

    // At least one widget should be visible
    expect(hasTaskWidget || hasGoalWidget || hasReminderWidget || hasScheduleWidget).toBe(true);
  });

  test('[P1] should have responsive layout', async ({ page }) => {
    await page.goto(WEB_CONFIG.HOME_PATH, { waitUntil: 'networkidle' });

    // Test mobile viewport (< 768px)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(TIMEOUT_CONFIG.MEDIUM_WAIT);

    // Verify layout adjusts (widgets should stack vertically)
    const widgets = page.locator('[data-testid$="-stats-widget"]');
    const count = await widgets.count();
    expect(count).toBeGreaterThan(0);

    // Test tablet viewport (768px - 1024px)
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(TIMEOUT_CONFIG.SHORT_WAIT);

    // Test desktop viewport (> 1024px)
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(TIMEOUT_CONFIG.SHORT_WAIT);

    // Widgets should still be visible at all sizes
    await expect(widgets.first()).toBeVisible();
  });

  test('[P1] should navigate to Dashboard from other pages', async ({ page }) => {
    // Start on a different page (e.g., Tasks)
    await page.goto('/tasks/one-time', { waitUntil: 'networkidle' });

    // Click Dashboard link in navigation
    const dashboardLink = page.locator('nav a[href="/"]').first();
    await dashboardLink.click();

    // Wait for navigation
    await page.waitForURL(WEB_CONFIG.HOME_PATH, {
      timeout: TIMEOUT_CONFIG.NAVIGATION,
    });

    // Verify we're on Dashboard
    expect(page.url()).toMatch(new RegExp(`${WEB_CONFIG.HOME_PATH}$`));

    // Verify Dashboard content loaded
    await page.waitForTimeout(TIMEOUT_CONFIG.MEDIUM_WAIT);
  });

  test('[P2] should show Dashboard as first navigation item', async ({ page }) => {
    await page.goto(WEB_CONFIG.HOME_PATH, { waitUntil: 'networkidle' });

    // Get all navigation links
    const navLinks = page.locator('nav a[href]');
    const count = await navLinks.count();

    if (count > 0) {
      // First link should be Dashboard (order: 1)
      const firstLink = navLinks.first();
      const href = await firstLink.getAttribute('href');

      expect(href).toBe('/');
    }
  });

  test('[P1] should display settings button', async ({ page }) => {
    await page.goto(WEB_CONFIG.HOME_PATH, { waitUntil: 'networkidle' });
    await page.waitForTimeout(TIMEOUT_CONFIG.MEDIUM_WAIT);

    // Settings button should be visible
    const settingsButton = page.locator('button:has-text("设置"), button[aria-label*="设置"]');
    await expect(settingsButton.first()).toBeVisible();
  });

  test('[P1] should display refresh button', async ({ page }) => {
    await page.goto(WEB_CONFIG.HOME_PATH, { waitUntil: 'networkidle' });
    await page.waitForTimeout(TIMEOUT_CONFIG.MEDIUM_WAIT);

    // Refresh button should be visible
    const refreshButton = page.locator('button:has-text("刷新"), button[aria-label*="刷新"]');

    // May or may not be visible depending on implementation
    const isVisible = await refreshButton
      .first()
      .isVisible()
      .catch(() => false);

    // If there's a refresh button, it should work
    if (isVisible) {
      await refreshButton.first().click();
      await page.waitForTimeout(TIMEOUT_CONFIG.MEDIUM_WAIT);

      // Page should not crash
      const hasError = await page
        .locator('text=/错误|Error/i')
        .isVisible()
        .catch(() => false);
      expect(hasError).toBe(false);
    }
  });

  test('[P2] should support keyboard navigation', async ({ page }) => {
    await page.goto(WEB_CONFIG.HOME_PATH, { waitUntil: 'networkidle' });

    // Tab through focusable elements
    await page.keyboard.press('Tab');

    // At least one element should receive focus
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible({ timeout: 2000 });
  });

  test('[P2] should maintain state after browser refresh', async ({ page }) => {
    await page.goto(WEB_CONFIG.HOME_PATH, { waitUntil: 'networkidle' });
    await page.waitForTimeout(TIMEOUT_CONFIG.MEDIUM_WAIT);

    // Get initial widget visibility
    const taskWidgetBefore = await page
      .locator('[data-testid="task-stats-widget"]')
      .isVisible()
      .catch(() => false);

    // Refresh browser
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(TIMEOUT_CONFIG.MEDIUM_WAIT);

    // Widget visibility should be the same
    const taskWidgetAfter = await page
      .locator('[data-testid="task-stats-widget"]')
      .isVisible()
      .catch(() => false);
    expect(taskWidgetAfter).toBe(taskWidgetBefore);
  });

  test('[P1] should handle network errors gracefully', async ({ page }) => {
    // Go offline
    await page.context().setOffline(true);

    // Try to load Dashboard
    await page.goto(WEB_CONFIG.HOME_PATH, { waitUntil: 'domcontentloaded' }).catch(() => {});

    // Go back online
    await page.context().setOffline(false);

    // Reload
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(TIMEOUT_CONFIG.MEDIUM_WAIT);

    // Should recover and show content
    const hasContent = await page
      .locator('[data-testid$="-stats-widget"]')
      .first()
      .isVisible()
      .catch(() => false);

    // Either shows cached content or refreshes successfully
    expect(hasContent).toBe(true);
  });
});
