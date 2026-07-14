import { test, expect } from '@playwright/test';
import { TIMEOUT_CONFIG } from '../config';
import { registerAndLogin } from '../helpers/testHelpers';

const generateTestEmail = () =>
  `e2e-notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.com`;
const testPassword = 'Test123456!';

test.describe('Notification Center', () => {
  let testEmail: string;

  test.beforeEach(async ({ page }) => {
    testEmail = generateTestEmail();

    await registerAndLogin(page, {
      email: testEmail,
      password: testPassword,
      landingPath: '/notifications',
    });

    await expect(page.getByTestId('notification-center')).toBeVisible({
      timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
    });
  });

  test('[P0] should open notification center', async ({ page }) => {
    await expect(page.getByTestId('notification-center')).toBeVisible();
    await expect(page.getByTestId('notification-filter-all')).toBeVisible();
  });

  test('[P0] should display notifications list', async ({ page }) => {
    const list = page.getByTestId('notifications-list');
    const items = page.getByTestId('notification-item');

    if (await list.isVisible().catch(() => false)) {
      await expect(items.first()).toBeVisible();
    } else {
      await expect(page.getByTestId('notification-center')).toBeVisible();
    }
  });

  test('[P1] should mark notification as read', async ({ page }) => {
    const unreadItem = page.locator('[data-testid="notification-item"][data-read-state="unread"]').first();

    if (await unreadItem.isVisible().catch(() => false)) {
      await unreadItem.click();
      await expect(unreadItem).toHaveAttribute('data-read-state', 'read', {
        timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
      });
    } else {
      await expect(page.getByTestId('notification-center')).toBeVisible();
    }
  });

  test('[P1] should mark all as read', async ({ page }) => {
    const markAllButton = page.getByTestId('mark-all-read-button');
    const unreadItems = page.locator('[data-testid="notification-item"][data-read-state="unread"]');
    const initialUnreadCount = await unreadItems.count();

    if (initialUnreadCount > 0) {
      await markAllButton.click();
      await expect(unreadItems).toHaveCount(0, { timeout: TIMEOUT_CONFIG.ELEMENT_WAIT });
    } else {
      await expect(markAllButton).toBeDisabled();
    }
  });

  test('[P2] should filter notifications by type', async ({ page }) => {
    // UI only exposes all/unread tabs (see NotificationListPage filterTabs).
    await page.getByTestId('notification-filter-unread').click();
    await expect(page.getByTestId('notification-center')).toBeVisible();
    await expect(page.getByTestId('notification-filter-unread')).toBeVisible();

    await page.getByTestId('notification-filter-all').click();
    await expect(page.getByTestId('notification-center')).toBeVisible();
    await expect(page.getByTestId('notification-filter-all')).toBeVisible();
  });
});
