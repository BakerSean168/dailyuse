import { test, expect, type Locator, type Page } from '@playwright/test';
import { TIMEOUT_CONFIG } from '../config';
import { registerAndLogin } from '../helpers/testHelpers';

const generateTestEmail = () =>
  `e2e-settings-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.com`;
const testPassword = 'Test123456!';

test.describe('Notification Settings', () => {
  let testEmail: string;

  test.beforeEach(async ({ page }) => {
    testEmail = generateTestEmail();

    await registerAndLogin(page, {
      email: testEmail,
      password: testPassword,
      landingPath: '/settings',
    });

    await resetSettings(page);
    await openNotificationsSettings(page);
  });

  test('should display notification settings', async ({ page }) => {
    await expect(page.getByTestId('notification-settings-card')).toBeVisible();
    await expect(page.getByTestId('notification-settings-switch')).toBeVisible();
  });

  test('should toggle notifications on or off', async ({ page }) => {
    const notificationToggle = page.getByTestId('notification-settings-switch');
    const initialState = await notificationToggle.getAttribute('aria-checked');

    await toggleSwitch(page, notificationToggle);
    await expect(notificationToggle).not.toHaveAttribute('aria-checked', initialState ?? '', {
      timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
    });
  });

  test('should keep notification settings available after reload', async ({ page }) => {
    await page.reload({ waitUntil: 'networkidle', timeout: TIMEOUT_CONFIG.NAVIGATION });
    await openNotificationsSettings(page);

    await expect(page.getByTestId('notification-settings-card')).toBeVisible();
    await expect(page.getByTestId('notification-settings-switch')).toBeVisible();
  });
});

async function openNotificationsSettings(page: Page) {
  await page.getByTestId('settings-tab-notifications').click();
  await expect(page.getByTestId('notification-settings-card')).toBeVisible({
    timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
  });
}

async function resetSettings(page: Page) {
  await page.evaluate(async () => {
    await fetch('/api/v1/settings/reset', { method: 'POST' });
  });
  await page.goto('/settings', {
    waitUntil: 'networkidle',
    timeout: TIMEOUT_CONFIG.NAVIGATION,
  });
}

async function toggleSwitch(page: Page, locator: Locator) {
  await locator.focus();
  await page.keyboard.press('Space');
}
