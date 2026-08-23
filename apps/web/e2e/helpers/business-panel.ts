import { expect, type Page } from '@playwright/test';

/**
 * Drag the split-view business panel from a stable, actually hittable resizer position.
 *
 * The panel width is animated outside an active drag. Reading a bounding box while that
 * transition is still settling can leave the pointer at a stale coordinate, so the test
 * starts by hovering the handle. Playwright's hover action waits for stability and pointer
 * event reception before we snapshot the geometry used by the low-level drag.
 */
export async function dragBusinessPanel(
  page: Page,
  direction: 'wider' | 'narrower',
): Promise<void> {
  const resizer = page.getByTestId('business-panel-resizer');
  await expect(resizer).toBeVisible();
  await resizer.hover();

  const box = await resizer.boundingBox();
  if (!box) throw new Error('business-panel-resizer has no bounding box');

  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;
  const endX = direction === 'wider' ? Math.max(40, startX - 160) : startX + 120;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(endX, startY, { steps: 12 });
  await page.mouse.up();
}
