import { test, expect, type Locator, type Page } from '@playwright/test';
import { API_CONFIG, TIMEOUT_CONFIG } from '../config';
import { ensureUserSettingsRecord, registerAndLogin } from '../helpers/testHelpers';

const generateTestEmail = () =>
  `e2e-persistence-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.com`;
const testPassword = 'Test123456!';

test.describe('Settings Persistence', () => {
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
  });

  test('[P1] should persist theme after page reload', async ({ page }) => {
    await openAppearanceSettings(page);
    await selectTheme(page, 'dark');

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    await page.reload({ waitUntil: 'domcontentloaded', timeout: TIMEOUT_CONFIG.NAVIGATION });
    await openAppearanceSettings(page);

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('[P1] should persist notifications settings after page reload', async ({ page }) => {
    await openNotificationsSettings(page);

    const notificationToggle = page.getByTestId('notification-settings-switch');
    const initialState = await notificationToggle.getAttribute('aria-checked');

    await toggleSwitch(page, notificationToggle);
    const updatedState = initialState === 'true' ? 'false' : 'true';
    await expect(notificationToggle).toHaveAttribute('aria-checked', updatedState, {
      timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
    });

    await page.reload({ waitUntil: 'domcontentloaded', timeout: TIMEOUT_CONFIG.NAVIGATION });
    await openNotificationsSettings(page);

    await expect(page.getByTestId('notification-settings-switch')).toHaveAttribute(
      'aria-checked',
      updatedState,
    );
  });

  test('[P2] should sync settings across tabs', async ({ page, context }) => {
    await openNotificationsSettings(page);

    const notificationToggle = page.getByTestId('notification-settings-switch');
    const initialState = await notificationToggle.getAttribute('aria-checked');
    const updatedState = initialState === 'true' ? 'false' : 'true';

    await toggleSwitch(page, notificationToggle);
    await expect(notificationToggle).toHaveAttribute('aria-checked', updatedState, {
      timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
    });

    const page2 = await context.newPage();
    await page2.goto('/settings', {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUT_CONFIG.NAVIGATION,
    });
    await openNotificationsSettings(page2);

    await expect(page2.getByTestId('notification-settings-switch')).toHaveAttribute(
      'aria-checked',
      updatedState,
    );

    await page2.close();
  });
});

async function openAppearanceSettings(page: Page) {
  await page.getByTestId('settings-tab-appearance').click();
  await expect(page.getByTestId('appearance-settings-card')).toBeVisible({
    timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
  });
}

async function openNotificationsSettings(page: Page) {
  await page.getByTestId('settings-tab-notifications').click();
  await expect(page.getByTestId('notification-settings-card')).toBeVisible({
    timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
  });
}

async function selectTheme(page: Page, theme: 'light' | 'dark' | 'auto') {
  const patchResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith('/api/v1/settings/appearance') &&
      response.request().method() === 'PATCH' &&
      response.ok(),
  );

  await themeTrigger(page).click();
  await page.getByTestId(`appearance-theme-option-${theme}`).click();
  await patchResponse;
}

function themeTrigger(page: Page): Locator {
  return page.getByTestId('appearance-theme-trigger');
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
