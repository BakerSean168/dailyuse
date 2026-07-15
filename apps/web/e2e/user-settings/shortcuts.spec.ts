import { test, expect } from '@playwright/test';

/**
 * E2E ??:?????
 * ????????????????????
 */

test.describe('Shortcut Settings', () => {
  test.beforeEach(async ({ page }) => {
    // ???????
    await page.goto('/settings');

    // ????????
    await page.waitForLoadState('domcontentloaded');

    // ??????? tab
    await page.getByRole('tab', { name: /Shortcuts/i }).click();
  });

  test('should display shortcut settings', async ({ page }) => {
    // ??????
    await expect(page.getByText(/Shortcut Settings/i)).toBeVisible();

    // ???????????
    await expect(page.locator('text=/Enable Shortcuts/i')).toBeVisible();
  });

  test('should toggle shortcuts on/off', async ({ page }) => {
    // ????????
    const shortcutToggle = page.locator('[role="switch"]').first();

    // ??????
    const initialState = await shortcutToggle.getAttribute('aria-checked');

    // ????
    await shortcutToggle.click();
    await page.waitForTimeout(500);

    // ???????
    const newState = await shortcutToggle.getAttribute('aria-checked');
    expect(newState).not.toBe(initialState);

    // ?????????/??
    const shortcutList = page.locator('text=/New Task|NEW_TASK/i');
    const isVisible = await shortcutList.isVisible();

    if (newState === 'true') {
      expect(isVisible).toBeTruthy();
    }
  });

  test('should display predefined shortcuts', async ({ page }) => {
    // ????????
    const shortcutToggle = page.locator('[role="switch"]').first();
    const isEnabled = await shortcutToggle.getAttribute('aria-checked');

    if (isEnabled !== 'true') {
      await shortcutToggle.click();
      await page.waitForTimeout(500);
    }

    // ??????????
    await expect(page.locator('text=/New Task/i')).toBeVisible();
    await expect(page.locator('text=/Global Search|Search/i')).toBeVisible();
    await expect(page.locator('text=/Save/i')).toBeVisible();
  });

  test('should record new shortcut', async ({ page }) => {
    // ????????
    const shortcutToggle = page.locator('[role="switch"]').first();
    const isEnabled = await shortcutToggle.getAttribute('aria-checked');

    if (isEnabled !== 'true') {
      await shortcutToggle.click();
      await page.waitForTimeout(500);
    }

    // ???????????
    const shortcutInput = page.locator('input[readonly]').first();

    // ?????
    await shortcutInput.click();
    await page.waitForTimeout(200);

    // ????(Ctrl+Shift+N)
    await page.keyboard.down('Control');
    await page.keyboard.down('Shift');
    await page.keyboard.press('N');
    await page.keyboard.up('Shift');
    await page.keyboard.up('Control');

    // ???????
    await page.waitForTimeout(500);

    // ????????
    const value = await shortcutInput.inputValue();
    expect(value).toMatch(/Ctrl.*Shift.*N/i);
  });

  test('should search shortcuts', async ({ page }) => {
    // ????????
    const shortcutToggle = page.locator('[role="switch"]').first();
    const isEnabled = await shortcutToggle.getAttribute('aria-checked');

    if (isEnabled !== 'true') {
      await shortcutToggle.click();
      await page.waitForTimeout(500);
    }

    // ?????
    const searchInput = page.getByPlaceholder(/Search shortcuts/i);

    if (await searchInput.isVisible()) {
      // ?? "??"
      await searchInput.fill('??');
      await page.waitForTimeout(300);

      // ???????????
      await expect(page.locator('text=/New Task/i')).toBeVisible();

      // ????????????
      const searchResults = await page.locator('[role="list"] li, .v-list-item').count();
      expect(searchResults).toBeLessThan(10); // ?????10???????
    }
  });

  test('should detect shortcut conflicts', async ({ page }) => {
    // ????????
    const shortcutToggle = page.locator('[role="switch"]').first();
    const isEnabled = await shortcutToggle.getAttribute('aria-checked');

    if (isEnabled !== 'true') {
      await shortcutToggle.click();
      await page.waitForTimeout(500);
    }

    // ????????
    const firstInput = page.locator('input[readonly]').nth(0);
    await firstInput.click();
    await page.keyboard.down('Control');
    await page.keyboard.press('T');
    await page.keyboard.up('Control');
    await page.waitForTimeout(500);

    // ??????????????(????)
    const secondInput = page.locator('input[readonly]').nth(1);
    await secondInput.click();
    await page.keyboard.down('Control');
    await page.keyboard.press('T');
    await page.keyboard.up('Control');
    await page.waitForTimeout(500);

    // ????????
    const conflictIndicator = page.locator('text=/Conflict/i');
    await expect(conflictIndicator).toBeVisible({ timeout: 2000 });
  });

  test('should clear shortcut', async ({ page }) => {
    // ????????
    const shortcutToggle = page.locator('[role="switch"]').first();
    const isEnabled = await shortcutToggle.getAttribute('aria-checked');

    if (isEnabled !== 'true') {
      await shortcutToggle.click();
      await page.waitForTimeout(500);
    }

    // ???????????
    const shortcutInput = page.locator('input[readonly]').first();

    // ???????
    await shortcutInput.click();
    await page.keyboard.down('Control');
    await page.keyboard.press('X');
    await page.keyboard.up('Control');
    await page.waitForTimeout(500);

    // ??????
    const clearButton = shortcutInput
      .locator('..')
      .getByRole('button', { name: /Clear|close/i })
      .first();
    await clearButton.click();
    await page.waitForTimeout(500);

    // ????????
    const value = await shortcutInput.inputValue();
    expect(value).toBe('');
  });

  test('should restore individual shortcut to default', async ({ page }) => {
    // ????????
    const shortcutToggle = page.locator('[role="switch"]').first();
    const isEnabled = await shortcutToggle.getAttribute('aria-checked');

    if (isEnabled !== 'true') {
      await shortcutToggle.click();
      await page.waitForTimeout(500);
    }

    // ???????????
    const shortcutInput = page.locator('input[readonly]').first();
    const originalValue = await shortcutInput.inputValue();

    // ?????
    await shortcutInput.click();
    await page.keyboard.down('Control');
    await page.keyboard.down('Alt');
    await page.keyboard.press('X');
    await page.keyboard.up('Alt');
    await page.keyboard.up('Control');
    await page.waitForTimeout(500);

    // ????????
    const restoreButton = shortcutInput
      .locator('..')
      .getByRole('button', { name: /Restore|restore/i })
      .first();

    if (await restoreButton.isVisible()) {
      await restoreButton.click();
      await page.waitForTimeout(500);

      // ????????
      const restoredValue = await shortcutInput.inputValue();
      expect(restoredValue).toBe(originalValue);
    }
  });

  test('should restore all shortcuts to defaults', async ({ page }) => {
    // ????????
    const shortcutToggle = page.locator('[role="switch"]').first();
    const isEnabled = await shortcutToggle.getAttribute('aria-checked');

    if (isEnabled !== 'true') {
      await shortcutToggle.click();
      await page.waitForTimeout(500);
    }

    // ???????
    const firstInput = page.locator('input[readonly]').nth(0);
    await firstInput.click();
    await page.keyboard.down('Control');
    await page.keyboard.press('Q');
    await page.keyboard.up('Control');
    await page.waitForTimeout(300);

    const secondInput = page.locator('input[readonly]').nth(1);
    await secondInput.click();
    await page.keyboard.down('Control');
    await page.keyboard.press('W');
    await page.keyboard.up('Control');
    await page.waitForTimeout(300);

    // ??????????
    const restoreAllButton = page.getByRole('button', { name: /Restore Defaults/i });
    await restoreAllButton.click();
    await page.waitForTimeout(1000);

    // ??????????(????????)
    const restoredValue = await firstInput.inputValue();
    expect(restoredValue).toMatch(/Ctrl.*N/i); // ????? Ctrl+N
  });

  test('should save shortcut changes', async ({ page }) => {
    // ????????
    const shortcutToggle = page.locator('[role="switch"]').first();
    const isEnabled = await shortcutToggle.getAttribute('aria-checked');

    if (isEnabled !== 'true') {
      await shortcutToggle.click();
      await page.waitForTimeout(500);
    }

    // ???????
    const shortcutInput = page.locator('input[readonly]').first();
    await shortcutInput.click();
    await page.keyboard.down('Control');
    await page.keyboard.down('Alt');
    await page.keyboard.press('M');
    await page.keyboard.up('Alt');
    await page.keyboard.up('Control');
    await page.waitForTimeout(500);

    // ??????
    const saveButton = page.getByRole('button', { name: /Save/i });

    if ((await saveButton.isVisible()) && !(await saveButton.isDisabled())) {
      await saveButton.click();

      // ??????
      await expect(page.locator('text=/Saved/i')).toBeVisible({ timeout: 3000 });
    }

    // ???????????
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.getByRole('tab', { name: /Shortcuts/i }).click();

    // ?????????
    const savedValue = await shortcutInput.inputValue();
    expect(savedValue).toMatch(/Ctrl.*Alt.*M/i);
  });

  test('should display platform-specific key symbols on Mac', async ({ page }) => {
    // ?? Mac ???????
    if (process.platform !== 'darwin') {
      test.skip();
      return;
    }

    // ????????
    const shortcutToggle = page.locator('[role="switch"]').first();
    const isEnabled = await shortcutToggle.getAttribute('aria-checked');

    if (isEnabled !== 'true') {
      await shortcutToggle.click();
      await page.waitForTimeout(500);
    }

    // ?? Mac ????
    const shortcutInput = page.locator('input[readonly]').first();
    const value = await shortcutInput.inputValue();

    // Mac ???????????
    expect(value).toMatch(/\S+/);
  });
});
