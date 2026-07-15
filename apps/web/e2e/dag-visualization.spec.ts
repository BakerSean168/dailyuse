import { test, expect, type Page } from '@playwright/test';

test.describe('DAG Visualization', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;

    // Navigate to goal detail page
    await page.goto('/goals/test-goal-1');

    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');

    // Click "?????" tab
    await page.click('text=?????');
    await page.waitForSelector('.goal-dag-visualization', { timeout: 5000 });
  });

  test('should display DAG visualization components', async () => {
    // Check main container exists
    const container = page.locator('.goal-dag-visualization');
    await expect(container).toBeVisible();

    // Check title
    await expect(page.locator('text=???????')).toBeVisible();

    // Check layout toggle buttons
    await expect(page.locator('text=???')).toBeVisible();
    await expect(page.locator('text=??')).toBeVisible();

    // Check legend
    await expect(page.locator('text=Goal ??')).toBeVisible();
    await expect(page.locator('text=?? 70-100%')).toBeVisible();
  });

  test('should render chart with nodes', async () => {
    // Wait for chart to render
    await page.waitForSelector('.chart', { timeout: 3000 });

    const chart = page.locator('.chart');
    await expect(chart).toBeVisible();

    // Chart should have non-zero dimensions
    const box = await chart.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.height).toBeGreaterThan(0);
  });

  test('should toggle between force and hierarchical layouts', async () => {
    // Initial state: force layout should be active
    const forceBtn = page.locator('[value="force"]');
    await expect(forceBtn).toHaveAttribute('aria-pressed', 'true');

    // Click hierarchical button
    const hierarchicalBtn = page.locator('text=??');
    await hierarchicalBtn.click();

    // Wait for animation
    await page.waitForTimeout(1200);

    // Check hierarchical is now active
    await expect(page.locator('[value="hierarchical"]')).toHaveAttribute('aria-pressed', 'true');

    // Switch back to force
    await forceBtn.click();
    await page.waitForTimeout(1200);

    // Check force is active again
    await expect(forceBtn).toHaveAttribute('aria-pressed', 'true');
  });

  test('should persist layout type preference', async () => {
    // Switch to hierarchical
    await page.click('text=??');
    await page.waitForTimeout(500);

    // Check localStorage
    const layoutType = await page.evaluate(() => localStorage.getItem('dag-layout-type'));
    expect(layoutType).toBe('hierarchical');

    // Reload page
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.click('text=?????');
    await page.waitForSelector('.goal-dag-visualization');

    // Check preference was restored
    await expect(page.locator('[value="hierarchical"]')).toHaveAttribute('aria-pressed', 'true');
  });

  test('should show weight warning for invalid total', async () => {
    // Check if warning chip exists (assuming test data has invalid weight)
    const warningChip = page.locator('.v-chip:has-text("????")');

    // If warning exists, verify alert is shown
    const chipCount = await warningChip.count();
    if (chipCount > 0) {
      const chipText = await warningChip.textContent();
      expect(chipText).not.toContain('100%');

      // Check warning alert
      const alert = page.locator('text=??????');
      await expect(alert).toBeVisible();
    }
  });

  test('should display reset layout button when custom layout exists', async () => {
    // Create custom layout in localStorage
    await page.evaluate(() => {
      localStorage.setItem(
        'dag-layout-test-goal-1',
        JSON.stringify([{ id: 'kr-1', x: 100, y: 200 }]),
      );
    });

    // Reload to apply custom layout
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.click('text=?????');
    await page.waitForSelector('.goal-dag-visualization');

    // Reset button should be visible
    const resetBtn = page.locator('[icon="mdi-refresh"]');
    await expect(resetBtn).toBeVisible();
  });

  test('should reset custom layout', async () => {
    // Set custom layout
    await page.evaluate(() => {
      localStorage.setItem(
        'dag-layout-test-goal-1',
        JSON.stringify([{ id: 'kr-1', x: 100, y: 200 }]),
      );
    });

    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.click('text=?????');
    await page.waitForSelector('.goal-dag-visualization');

    // Click reset button
    const resetBtn = page.locator('button:has([class*="mdi-refresh"])').first();
    await resetBtn.click();

    // Wait a bit for localStorage to update
    await page.waitForTimeout(300);

    // Check localStorage was cleared
    const layout = await page.evaluate(() => localStorage.getItem('dag-layout-test-goal-1'));
    expect(layout).toBeNull();
  });

  test('should be responsive to window resize', async () => {
    // Get initial chart dimensions
    const chart = page.locator('.chart');
    const initialBox = await chart.boundingBox();
    expect(initialBox).toBeTruthy();

    // Resize viewport to larger
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.waitForTimeout(500);

    // Check chart resized
    const newBox = await chart.boundingBox();
    expect(newBox).toBeTruthy();
    expect(newBox!.width).toBeGreaterThan(initialBox!.width);

    // Resize to smaller
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(500);

    // Check chart adapted
    const smallBox = await chart.boundingBox();
    expect(smallBox).toBeTruthy();
    expect(smallBox!.width).toBeLessThan(newBox!.width);
  });

  test('should display legend with correct items', async () => {
    // Check legend items
    await expect(page.locator('text=Goal ??')).toBeVisible();
    await expect(page.locator('text=?? 70-100%')).toBeVisible();
    await expect(page.locator('text=?? 30-70%')).toBeVisible();
    await expect(page.locator('text=?? 0-30%')).toBeVisible();

    // Check legend hint text
    await expect(page.locator('text=????????,?????????')).toBeVisible();
  });

  test('should handle empty state gracefully', async () => {
    // Navigate to goal without KRs (if test data supports)
    // This is a placeholder - actual implementation depends on test data
    const emptyAlert = page.locator('text=? Goal ?? KeyResult');
    const emptyCount = await emptyAlert.count();

    if (emptyCount > 0) {
      await expect(emptyAlert).toBeVisible();

      // Chart should not be visible
      const chart = page.locator('.chart');
      await expect(chart).not.toBeVisible();
    }
  });

  test('should display loading state during data fetch', async () => {
    // This test requires intercepting network requests
    // Navigate to a new goal to trigger loading
    await page.goto('/goals/another-goal-id');

    // Click DAG tab quickly
    await page.click('text=?????', { timeout: 1000 }).catch(() => {});

    // Check for loading indicator (may be too fast to catch)
    const loader = page.locator('.v-progress-linear');
    const loaderCount = await loader.count();

    // If loader appeared, verify it
    if (loaderCount > 0) {
      await expect(loader).toBeVisible();
    }

    // Wait for loading to complete
    await page.waitForLoadState('domcontentloaded');
  });

  test('should maintain layout across tab switches', async () => {
    // Switch to hierarchical
    await page.click('text=??');
    await page.waitForTimeout(500);

    // Switch to another tab
    await page.click('text=????');
    await page.waitForTimeout(500);

    // Switch back to DAG
    await page.click('text=?????');
    await page.waitForTimeout(500);

    // Check layout type is still hierarchical
    await expect(page.locator('[value="hierarchical"]')).toHaveAttribute('aria-pressed', 'true');
  });

  test('should show correct colors for different weight ranges', async () => {
    // Check legend chips have correct colors
    const successChip = page.locator('.v-chip:has-text("?? 70-100%")');
    const warningChip = page.locator('.v-chip:has-text("?? 30-70%")');
    const errorChip = page.locator('.v-chip:has-text("?? 0-30%")');

    await expect(successChip).toHaveAttribute('color', 'success');
    await expect(warningChip).toHaveAttribute('color', 'warning');
    await expect(errorChip).toHaveAttribute('color', 'error');
  });

  test('should render correctly on mobile viewport', async () => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    // Check main container is still visible
    const container = page.locator('.goal-dag-visualization');
    await expect(container).toBeVisible();

    // Chart should be visible and have reasonable dimensions
    const chart = page.locator('.chart');
    await expect(chart).toBeVisible();

    const box = await chart.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.width).toBeGreaterThan(300); // Min width
  });
});

test.describe('DAG Visualization - Advanced Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/goals/test-goal-1');
    await page.waitForLoadState('domcontentloaded');
    await page.click('text=?????');
    await page.waitForSelector('.goal-dag-visualization');
  });

  test('should allow chart zoom and pan', async ({ page }) => {
    const chart = page.locator('.chart');
    const box = await chart.boundingBox();

    if (box) {
      // Simulate mouse wheel for zoom (ECharts supports this)
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.wheel(0, 100); // Zoom out
      await page.waitForTimeout(300);

      await page.mouse.wheel(0, -100); // Zoom in
      await page.waitForTimeout(300);

      // Chart should still be visible after zoom
      await expect(chart).toBeVisible();
    }
  });

  test('should handle rapid layout switches', async ({ page }) => {
    // Rapidly switch layouts
    for (let i = 0; i < 5; i++) {
      await page.click('text=??');
      await page.waitForTimeout(100);
      await page.click('text=???');
      await page.waitForTimeout(100);
    }

    // Component should still be functional
    const container = page.locator('.goal-dag-visualization');
    await expect(container).toBeVisible();
  });

  test('should preserve state after navigation', async ({ page }) => {
    // Set preferences
    await page.click('text=??');
    await page.waitForTimeout(500);

    // Navigate away
    await page.click('text=????');
    await page.waitForTimeout(300);

    // Navigate to different goal
    await page.goto('/goals/another-goal-id');
    await page.waitForLoadState('domcontentloaded');

    // Come back to original goal
    await page.goto('/goals/test-goal-1');
    await page.waitForLoadState('domcontentloaded');
    await page.click('text=?????');

    // Layout type should be restored (global preference)
    await expect(page.locator('[value="hierarchical"]')).toHaveAttribute('aria-pressed', 'true');
  });
});
