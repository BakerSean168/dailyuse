import { test, expect } from '@playwright/test';

/**
 * E2E ??:????
 * ??????????????
 */

test.describe('Appearance Settings', () => {
  test.beforeEach(async ({ page }) => {
    // ???????
    await page.goto('/settings');

    // ????????
    await page.waitForLoadState('networkidle');

    // ?????? tab
    await page.getByRole('tab', { name: /Appearance/i }).click();
  });

  test('should display appearance settings', async ({ page }) => {
    // ??????
    await expect(page.getByText(/Appearance/i)).toBeVisible();

    // ?????????
    await expect(page.locator('text=??')).toBeVisible();

    // ?????????
    await expect(page.locator('text=??')).toBeVisible();
  });

  test('should switch theme', async ({ page }) => {
    // ?????????
    const themeSelect = page
      .locator('select, [role="combobox"]')
      .filter({ hasText: /light|dark|auto/i })
      .first();

    // ???????
    await themeSelect.click();
    await page.getByText('??', { exact: false }).click();

    // ??????
    await page.waitForTimeout(500);

    // ???????(?? HTML ??? class ? data ??)
    const html = page.locator('html');
    const classList = await html.getAttribute('class');

    // ????????(??? class="dark" ? data-theme="dark")
    expect(classList).toMatch(/dark/i);
  });

  test('should save theme preference', async ({ page }) => {
    // ????
    const themeSelect = page
      .locator('select, [role="combobox"]')
      .filter({ hasText: /light|dark|auto/i })
      .first();
    await themeSelect.click();
    await page.getByText('??', { exact: false }).click();

    // ????
    await page.reload();
    await page.waitForLoadState('networkidle');

    // ????????
    const html = page.locator('html');
    const classList = await html.getAttribute('class');
    expect(classList).toMatch(/dark/i);
  });

  test('should switch language', async ({ page }) => {
    // ?????????
    const languageSelect = page
      .locator('select, [role="combobox"]')
      .filter({ hasText: /English/i })
      .first();

    // ??????
    const currentText = await page.locator('h2, h3').first().textContent();

    // ????
    await languageSelect.click();
    await page.getByText(/English/i).click();

    // ??????
    await page.waitForTimeout(500);

    // ?????????
    const newText = await page.locator('h2, h3').first().textContent();
    expect(newText).not.toBe(currentText);
  });

  test('should display color scheme options', async ({ page }) => {
    // ??????????
    await expect(page.locator('text=/Auto/')).toBeVisible();

    // ????????
    await expect(page.locator('text=/Light/')).toBeVisible();

    // ????????
    await expect(page.locator('text=/Dark/')).toBeVisible();
  });

  test('should show success message after save', async ({ page }) => {
    // ????
    const themeSelect = page
      .locator('select, [role="combobox"]')
      .filter({ hasText: /light|dark|auto/i })
      .first();
    await themeSelect.click();
    await page.getByText('??', { exact: false }).click();

    // ?????????(???)
    const saveButton = page.getByRole('button', { name: /Save/i });
    if (await saveButton.isVisible()) {
      await saveButton.click();

      // ??????
      await expect(page.locator('text=/Saved/i')).toBeVisible({ timeout: 3000 });
    }
  });

  test('should handle auto-save mode', async ({ page }) => {
    // ?????????,????????
    const themeSelect = page
      .locator('select, [role="combobox"]')
      .filter({ hasText: /light|dark|auto/i })
      .first();

    // ????
    await themeSelect.click();
    await page.getByText('??', { exact: false }).click();

    // ??????
    await page.waitForTimeout(1000);

    // ??????
    await page.reload();
    await page.waitForLoadState('networkidle');

    // ???????
    const html = page.locator('html');
    const classList = await html.getAttribute('class');
    expect(classList).toMatch(/light/i);
  });
});
