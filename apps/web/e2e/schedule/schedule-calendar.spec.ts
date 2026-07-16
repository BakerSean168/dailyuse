import { expect, test, type Locator, type Page } from '@playwright/test';
import { TIMEOUT_CONFIG } from '../config';
import { registerAndLogin } from '../helpers/testHelpers';

const testPassword = 'Test123456!';

test.describe('Schedule calendar workspace', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page, {
      email: `e2e-schedule-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.com`,
      password: testPassword,
      landingPath: '/schedule/calendar',
    });

    await expect(page.getByTestId('schedule-calendar-view')).toBeVisible({
      timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
    });
  });

  test('[P0] keeps week view, period, DOM, and scroll across panel layouts', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    const root = page.getByTestId('schedule-calendar-view');
    const toolbar = page.getByTestId('schedule-page-toolbar');
    const content = page.getByTestId('schedule-calendar-content');
    const weekCalendar = page.getByTestId('schedule-week-calendar');
    const weekTab = page.getByTestId('schedule-view-tab-week');
    const periodLabel = page.getByTestId('schedule-period-label');
    const scrollHost = page.getByTestId('schedule-calendar-scroll-host');
    const primaryCreate = page.locator('[data-primary-action="create-schedule"]:visible');

    await expect(weekCalendar).toBeVisible({ timeout: TIMEOUT_CONFIG.ELEMENT_WAIT });
    await expect(weekTab).toHaveAttribute('aria-selected', 'true');
    await expect(primaryCreate).toHaveCount(1);
    await markDomIdentity(toolbar, 'toolbar');
    await markDomIdentity(content, 'content');
    await markDomIdentity(weekCalendar, 'week');
    const periodText = await periodLabel.innerText();
    const scrollTop = await scrollHost.evaluate((element) => {
      element.scrollTop = Math.min(96, element.scrollHeight - element.clientHeight);
      return element.scrollTop;
    });
    expect(scrollTop).toBeGreaterThan(0);

    await dragBusinessPanel(page, 'wider');
    await assertStableSchedule({
      toolbar,
      content,
      weekCalendar,
      weekTab,
      periodLabel,
      periodText,
      scrollHost,
      scrollTop,
      primaryCreate,
    });

    await dragBusinessPanel(page, 'narrower');
    await assertStableSchedule({
      toolbar,
      content,
      weekCalendar,
      weekTab,
      periodLabel,
      periodText,
      scrollHost,
      scrollTop,
      primaryCreate,
    });

    await page.getByTestId('business-panel-focus-toggle').click();
    await expect(page.getByTestId('app-shell')).toHaveAttribute('data-shell-state', 'focus');
    await assertStableSchedule({
      toolbar,
      content,
      weekCalendar,
      weekTab,
      periodLabel,
      periodText,
      scrollHost,
      scrollTop,
      primaryCreate,
    });
    await expectElementToFit(toolbar);
    await expectElementToFit(root);
  });

  test('[P0] switches every calendar view and navigates its period from one toolbar', async ({
    page,
  }) => {
    const periodLabel = page.getByTestId('schedule-period-label');

    await page.getByTestId('schedule-view-tab-month').click();
    await expect(page.getByTestId('schedule-view-tab-month')).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(page.getByTestId('schedule-month-calendar')).toBeVisible();
    const initialMonth = await periodLabel.innerText();
    await page.getByTestId('schedule-next-period').click();
    await expect(periodLabel).not.toHaveText(initialMonth);

    await page.getByTestId('schedule-view-tab-day').click();
    await expect(page.getByTestId('schedule-day-calendar')).toBeVisible();
    await expect(page.getByTestId('schedule-view-tab-day')).toHaveAttribute('aria-selected', 'true');
  });

  test('[P0] creates a schedule from the only primary action', async ({ page }) => {
    const title = `E2E Schedule ${Date.now()}`;

    await page.getByTestId('create-schedule-button').click();
    const dialog = page.getByTestId('schedule-dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByTestId('schedule-title-input').fill(title);
    await dialog.getByTestId('schedule-save-button').click();

    await expect(dialog).toBeHidden({ timeout: TIMEOUT_CONFIG.ELEMENT_WAIT });
    await expect(page.getByText(title, { exact: true }).first()).toBeVisible({
      timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
    });
  });
});

async function markDomIdentity(locator: Locator, value: string): Promise<void> {
  await locator.evaluate((element, marker) => {
    element.setAttribute('data-instance-probe', marker);
  }, value);
}

async function assertStableSchedule({
  toolbar,
  content,
  weekCalendar,
  weekTab,
  periodLabel,
  periodText,
  scrollHost,
  scrollTop,
  primaryCreate,
}: {
  toolbar: Locator;
  content: Locator;
  weekCalendar: Locator;
  weekTab: Locator;
  periodLabel: Locator;
  periodText: string;
  scrollHost: Locator;
  scrollTop: number;
  primaryCreate: Locator;
}): Promise<void> {
  await expect(primaryCreate).toHaveCount(1);
  await expect(toolbar).toHaveAttribute('data-instance-probe', 'toolbar');
  await expect(content).toHaveAttribute('data-instance-probe', 'content');
  await expect(weekCalendar).toHaveAttribute('data-instance-probe', 'week');
  await expect(weekTab).toHaveAttribute('aria-selected', 'true');
  await expect(periodLabel).toHaveText(periodText);
  expect(await scrollHost.evaluate((element) => element.scrollTop)).toBe(scrollTop);
}

async function expectElementToFit(locator: Locator): Promise<void> {
  const metrics = await locator.evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
  }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
}

async function dragBusinessPanel(page: Page, direction: 'wider' | 'narrower'): Promise<void> {
  const resizer = page.getByTestId('business-panel-resizer');
  await expect(resizer).toBeVisible();
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
