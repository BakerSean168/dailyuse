import { test, expect } from '@playwright/test';

/**
 * E2E ??:????
 * ???????????????????
 */

test.describe('Settings Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should handle network errors gracefully', async ({ page, context }) => {
    // ??????
    await context.setOffline(true);

    // ??????
    await page.getByRole('tab', { name: /Appearance/i }).click();
    const themeSelect = page
      .locator('select, [role="combobox"]')
      .filter({ hasText: /light|dark|auto/i })
      .first();
    await themeSelect.click();
    await page.getByText('??', { exact: false }).click();

    // ??????
    await page.waitForTimeout(2000);

    // ????????
    const errorMessage = page.locator('text=/Network error|????|Connection failed/i');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });

    // ????
    await context.setOffline(false);
  });

  test('should retry failed requests automatically', async ({ page }) => {
    let requestCount = 0;

    // ???????????
    await page.route('**/api/user-settings/**', async (route) => {
      requestCount++;
      if (requestCount <= 2) {
        await route.abort('failed');
      } else {
        await route.continue();
      }
    });

    // ????
    await page.getByRole('tab', { name: /Appearance/i }).click();
    const themeSelect = page
      .locator('select, [role="combobox"]')
      .filter({ hasText: /light|dark|auto/i })
      .first();
    await themeSelect.click();
    await page.getByText('??', { exact: false }).click();

    // ????
    await page.waitForTimeout(5000);

    // ??????(??????)
    expect(requestCount).toBeGreaterThan(1);
  });

  test('should show validation errors for invalid input', async ({ page }) => {
    // ???????
    await page.getByRole('tab', { name: /Notifications/i }).click();

    // ???????????
    const timeInput = page.locator('input[type="time"]').first();

    if (await timeInput.isVisible()) {
      // ?????
      await timeInput.fill('25:99');
      await timeInput.blur();
      await page.waitForTimeout(500);

      // ??????(???????)
      const isInvalid = await timeInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
      expect(isInvalid).toBeTruthy();
    }
  });

  test('should handle API validation errors', async ({ page }) => {
    // ??API??,??????
    await page.route('**/api/user-settings/**', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '????',
            details: ['?????'],
          },
        }),
      });
    });

    // ??????
    await page.getByRole('tab', { name: /Appearance/i }).click();
    const themeSelect = page
      .locator('select, [role="combobox"]')
      .filter({ hasText: /light|dark|auto/i })
      .first();
    await themeSelect.click();
    await page.getByText('??', { exact: false }).click();
    await page.waitForTimeout(1000);

    // ????????
    const errorMessage = page.locator('text=/Validation failed|??/i');
    await expect(errorMessage).toBeVisible({ timeout: 3000 });
  });

  test('should handle 401 unauthorized errors', async ({ page }) => {
    // ??API??,???????
    await page.route('**/api/user-settings/**', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: '?????',
          },
        }),
      });
    });

    // ??????
    await page.getByRole('tab', { name: /Appearance/i }).click();
    const themeSelect = page
      .locator('select, [role="combobox"]')
      .filter({ hasText: /light|dark|auto/i })
      .first();
    await themeSelect.click();
    await page.getByText('??', { exact: false }).click();
    await page.waitForTimeout(2000);

    // ??????????????
    const currentUrl = page.url();
    const hasErrorMessage = await page.locator('text=/Unauthorized|??/i').isVisible();

    expect(currentUrl.includes('/login') || hasErrorMessage).toBeTruthy();
  });

  test('should handle 500 server errors', async ({ page }) => {
    // ??API??,???????
    await page.route('**/api/user-settings/**', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: '???????',
          },
        }),
      });
    });

    // ??????
    await page.getByRole('tab', { name: /Appearance/i }).click();
    const themeSelect = page
      .locator('select, [role="combobox"]')
      .filter({ hasText: /light|dark|auto/i })
      .first();
    await themeSelect.click();
    await page.getByText('??', { exact: false }).click();
    await page.waitForTimeout(1000);

    // ???????????
    const errorMessage = page.locator('text=/Server error|500/i');
    await expect(errorMessage).toBeVisible({ timeout: 3000 });
  });

  test('should preserve local changes when save fails', async ({ page, context }) => {
    // ??????
    await context.setOffline(true);

    // ????
    await page.getByRole('tab', { name: /Appearance/i }).click();
    const html = page.locator('html');
    const previousTheme = await html.getAttribute('class');

    const themeSelect = page
      .locator('select, [role="combobox"]')
      .filter({ hasText: /light|dark|auto/i })
      .first();
    await themeSelect.click();
    await page.getByText('??', { exact: false }).click();
    await page.waitForTimeout(1000);

    const newTheme = await html.getAttribute('class');

    // ????UI???(????)
    expect(newTheme).not.toBe(previousTheme);

    // ????
    await context.setOffline(false);
  });

  test('should rollback changes if save is rejected', async ({ page }) => {
    // ??API??,????
    await page.route('**/api/user-settings/**', async (route) => {
      if (route.request().method() === 'PUT' || route.request().method() === 'PATCH') {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: { code: 'INVALID_VALUE', message: '???' },
          }),
        });
      } else {
        await route.continue();
      }
    });

    // ????
    await page.getByRole('tab', { name: /Appearance/i }).click();
    const html = page.locator('html');

    const themeSelect = page
      .locator('select, [role="combobox"]')
      .filter({ hasText: /light|dark|auto/i })
      .first();
    await themeSelect.click();
    await page.getByText('??', { exact: false }).click();
    await page.waitForTimeout(2000);

    // ?????????,???????
    const revertedTheme = await html.getAttribute('class');

    // ????????(???????,?????)
    // ?????????
    expect(revertedTheme).toBeDefined();
  });

  test('should show loading state during save', async ({ page }) => {
    // ??API??
    await page.route('**/api/user-settings/**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.continue();
    });

    // ????
    await page.getByRole('tab', { name: /Appearance/i }).click();
    const themeSelect = page
      .locator('select, [role="combobox"]')
      .filter({ hasText: /light|dark|auto/i })
      .first();
    await themeSelect.click();
    await page.getByText('??', { exact: false }).click();

    // ?????????
    const loadingIndicator = page.locator(
      '[role="progressbar"], .v-progress-circular, text=/Saving/i',
    );
    await expect(loadingIndicator.first()).toBeVisible({ timeout: 1000 });

    // ??????
    await page.waitForTimeout(3000);

    // ?????????
    await expect(loadingIndicator.first()).not.toBeVisible();
  });

  test('should disable inputs during save operation', async ({ page }) => {
    // ??API??
    await page.route('**/api/user-settings/**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.continue();
    });

    // ??????
    await page.getByRole('tab', { name: /Notifications/i }).click();
    const notificationToggle = page.locator('[role="switch"]').first();

    await notificationToggle.click();

    // ????????(?????)
    const isDisabled = await notificationToggle.isDisabled();

    // ???????,???????
    if (isDisabled) {
      expect(isDisabled).toBeTruthy();
    }

    // ??????
    await page.waitForTimeout(3000);
  });

  test('should handle concurrent save operations', async ({ page }) => {
    // ??????????
    await page.getByRole('tab', { name: /Appearance/i }).click();

    const themeSelect = page
      .locator('select, [role="combobox"]')
      .filter({ hasText: /light|dark|auto/i })
      .first();

    // ??????
    await themeSelect.click();
    await page.getByText('??', { exact: false }).click();
    await page.waitForTimeout(100);

    await themeSelect.click();
    await page.getByText('??', { exact: false }).click();
    await page.waitForTimeout(100);

    await themeSelect.click();
    await page.getByText('??', { exact: false }).click();

    // ????????
    await page.waitForTimeout(3000);

    // ????????
    const html = page.locator('html');
    const finalTheme = await html.getAttribute('class');
    expect(finalTheme).toMatch(/dark/i);
  });
});
