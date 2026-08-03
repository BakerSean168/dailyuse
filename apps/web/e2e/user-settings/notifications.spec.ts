import { test, expect, type Locator, type Page } from '@playwright/test';
import { API_CONFIG, TIMEOUT_CONFIG } from '../config';
import { ensureUserSettingsRecord, registerAndLogin } from '../helpers/testHelpers';

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

    await ensureUserSettingsRecord(page);
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

    const updatedState = initialState === 'true' ? 'false' : 'true';

    await toggleSwitch(page, notificationToggle);
    await expect(notificationToggle).toHaveAttribute('aria-checked', updatedState, {
      timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
    });
  });

  test('should keep notification settings available after reload', async ({ page }) => {
    await page.reload({ waitUntil: 'domcontentloaded', timeout: TIMEOUT_CONFIG.NAVIGATION });
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
  const resetResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith('/api/v1/settings/reset') &&
      response.request().method() === 'POST' &&
      response.ok(),
  );

  await page.evaluate(async (apiBaseUrl) => {
    await fetch(`${apiBaseUrl}/settings/reset`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
  }, API_CONFIG.FULL_URL);
  await resetResponse;

  await page.goto('/settings', {
    waitUntil: 'domcontentloaded',
    timeout: TIMEOUT_CONFIG.NAVIGATION,
  });
}

async function toggleSwitch(page: Page, locator: Locator) {
  const patchResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith('/api/v1/settings/notification') &&
      response.request().method() === 'PATCH' &&
      response.ok(),
  );

  await locator.click();
  await patchResponse;
}
