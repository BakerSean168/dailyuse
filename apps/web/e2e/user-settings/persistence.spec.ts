import { test, expect, type Locator, type Page } from '@playwright/test';
import { TIMEOUT_CONFIG } from '../config';
import { registerAndLogin } from '../helpers/testHelpers';

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

    await resetSettings(page);
  });

  test('[P1] should persist theme after page reload', async ({ page }) => {
    await openAppearanceSettings(page);
    await selectTheme(page, 'dark');

    await expect(themeTrigger(page)).toContainText(/dark/i);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    await page.reload({ waitUntil: 'networkidle', timeout: TIMEOUT_CONFIG.NAVIGATION });
    await openAppearanceSettings(page);

    await expect(themeTrigger(page)).toContainText(/dark/i);
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

    await page.reload({ waitUntil: 'networkidle', timeout: TIMEOUT_CONFIG.NAVIGATION });
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
      waitUntil: 'networkidle',
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
  await themeTrigger(page).click();
  await page.getByRole('option', { name: new RegExp(theme, 'i') }).click();
}

function themeTrigger(page: Page): Locator {
  return page.getByRole('combobox', { name: /theme/i });
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
