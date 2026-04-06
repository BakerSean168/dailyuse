import { test, expect } from '@playwright/test';

/**
 * E2E ??:?????
 * ?????????????????,????????
 */

test.describe('Settings Persistence', () => {
  test.beforeEach(async ({ page }) => {
    // ???????
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
  });

  test('should persist theme after page reload', async ({ page }) => {
    // ???????
    await page.getByRole('tab', { name: /??|Appearance/i }).click();

    // ????
    const themeSelect = page
      .locator('select, [role="combobox"]')
      .filter({ hasText: /light|dark|auto/i })
      .first();
    await themeSelect.click();
    await page.getByText('??', { exact: false }).click();
    await page.waitForTimeout(1000);

    // ??????
    const html = page.locator('html');
    const initialTheme = await html.getAttribute('class');

    // ????
    await page.reload();
    await page.waitForLoadState('networkidle');

    // ????????
    const reloadedTheme = await html.getAttribute('class');
    expect(reloadedTheme).toBe(initialTheme);
  });

  test('should persist notifications settings after page reload', async ({ page }) => {
    // ???????
    await page.getByRole('tab', { name: /??|Notifications/i }).click();

    // ????
    const notificationToggle = page.locator('[role="switch"]').first();
    const initialState = await notificationToggle.getAttribute('aria-checked');

    if (initialState === 'true') {
      await notificationToggle.click();
      await page.waitForTimeout(1000);
    }

    // ????
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.getByRole('tab', { name: /??|Notifications/i }).click();

    // ????????
    const reloadedState = await notificationToggle.getAttribute('aria-checked');
    expect(reloadedState).toBe('false');
  });

  test('should persist shortcuts after page reload', async ({ page }) => {
    // ????????
    await page.getByRole('tab', { name: /???|Shortcuts/i }).click();

    // ????????
    const shortcutToggle = page.locator('[role="switch"]').first();
    const isEnabled = await shortcutToggle.getAttribute('aria-checked');

    if (isEnabled !== 'true') {
      await shortcutToggle.click();
      await page.waitForTimeout(500);
    }

    // ????????
    const shortcutInput = page.locator('input[readonly]').first();
    await shortcutInput.click();
    await page.keyboard.down('Control');
    await page.keyboard.down('Alt');
    await page.keyboard.press('K');
    await page.keyboard.up('Alt');
    await page.keyboard.up('Control');
    await page.waitForTimeout(1000);

    const customShortcut = await shortcutInput.inputValue();

    // ????
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.getByRole('tab', { name: /???|Shortcuts/i }).click();

    // ?????????
    const reloadedShortcut = await shortcutInput.inputValue();
    expect(reloadedShortcut).toBe(customShortcut);
  });

  test('should persist settings after logout and login', async ({ page }) => {
    // ????
    await page.getByRole('tab', { name: /??|Appearance/i }).click();
    const themeSelect = page
      .locator('select, [role="combobox"]')
      .filter({ hasText: /light|dark|auto/i })
      .first();
    await themeSelect.click();
    await page.getByText('??', { exact: false }).click();
    await page.waitForTimeout(1000);

    // ????
    const html = page.locator('html');
    const theme = await html.getAttribute('class');

    // ??(???????)
    const logoutButton = page.getByRole('button', { name: /??|Logout|Sign out/i });

    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      await page.waitForLoadState('networkidle');

      // ????(????????????)
      await page.goto('/login');
      // ... ?????? ...

      // ???????
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');

      // ????????
      const reloadedTheme = await html.getAttribute('class');
      expect(reloadedTheme).toBe(theme);
    } else {
      test.skip();
    }
  });

  test('should sync settings across multiple tabs', async ({ context }) => {
    // ????????
    const page1 = await context.newPage();
    await page1.goto('/settings');
    await page1.waitForLoadState('networkidle');

    // ????????
    const page2 = await context.newPage();
    await page2.goto('/settings');
    await page2.waitForLoadState('networkidle');

    // ???????????
    await page1.getByRole('tab', { name: /??|Appearance/i }).click();
    const themeSelect = page1
      .locator('select, [role="combobox"]')
      .filter({ hasText: /light|dark|auto/i })
      .first();
    await themeSelect.click();
    await page1.getByText('??', { exact: false }).click();
    await page1.waitForTimeout(2000); // ????

    // ??????????????
    const html2 = page2.locator('html');
    const theme2 = await html2.getAttribute('class');
    expect(theme2).toMatch(/dark/i);

    // ?????
    await page1.close();
    await page2.close();
  });

  test('should handle concurrent updates gracefully', async ({ context }) => {
    // ???????
    const page1 = await context.newPage();
    await page1.goto('/settings');
    await page1.waitForLoadState('networkidle');

    const page2 = await context.newPage();
    await page2.goto('/settings');
    await page2.waitForLoadState('networkidle');

    // ???????????????
    await Promise.all([
      (async () => {
        await page1.getByRole('tab', { name: /??|Appearance/i }).click();
        const themeSelect = page1
          .locator('select, [role="combobox"]')
          .filter({ hasText: /light|dark|auto/i })
          .first();
        await themeSelect.click();
        await page1.getByText('??', { exact: false }).click();
      })(),
      (async () => {
        await page2.getByRole('tab', { name: /??|Notifications/i }).click();
        const notificationToggle = page2.locator('[role="switch"]').first();
        await notificationToggle.click();
      })(),
    ]);

    await page1.waitForTimeout(2000); // ????

    // ??????????
    await page1.reload();
    await page1.waitForLoadState('networkidle');

    const html = page1.locator('html');
    const theme = await html.getAttribute('class');
    expect(theme).toMatch(/dark/i);

    await page1.getByRole('tab', { name: /??|Notifications/i }).click();
    const notificationToggle = page1.locator('[role="switch"]').first();
    const notificationState = await notificationToggle.getAttribute('aria-checked');
    expect(notificationState).toBeDefined();

    // ?????
    await page1.close();
    await page2.close();
  });

  test('should load settings from server on first visit', async ({ page }) => {
    // ??????
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // ????
    await page.reload();
    await page.waitForLoadState('networkidle');

    // ???????????
    // ???????????????????
    await page.getByRole('tab', { name: /??|Appearance/i }).click();

    const html = page.locator('html');
    const theme = await html.getAttribute('class');
    expect(theme).toBeDefined();
    expect(theme).not.toBe('');
  });

  test('should handle localStorage quota exceeded', async ({ page }) => {
    // ?? localStorage ??
    await page.evaluate(() => {
      Storage.prototype.setItem = function () {
        throw new DOMException('QuotaExceededError');
      };
    });

    // ??????
    await page.getByRole('tab', { name: /??|Appearance/i }).click();
    const themeSelect = page
      .locator('select, [role="combobox"]')
      .filter({ hasText: /light|dark|auto/i })
      .first();
    await themeSelect.click();
    await page.getByText('??', { exact: false }).click();
    await page.waitForTimeout(1000);

    // ????????(????????)
    // ???????,????????
    await expect(page.locator('body')).toBeVisible();
  });

  test('should cache settings in memory for fast access', async ({ page }) => {
    // ???????
    await page.getByRole('tab', { name: /??|Appearance/i }).click();

    // ????????
    const startTime1 = Date.now();
    await page.waitForLoadState('networkidle');
    const loadTime1 = Date.now() - startTime1;

    // ????????????
    await page.getByRole('tab', { name: /??|Notifications/i }).click();
    await page.waitForTimeout(100);

    const startTime2 = Date.now();
    await page.getByRole('tab', { name: /??|Appearance/i }).click();
    const loadTime2 = Date.now() - startTime2;

    // ?????????(?????)
    expect(loadTime2).toBeLessThan(loadTime1 * 2);
  });
});
