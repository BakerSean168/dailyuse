import { expect, test, type Locator, type Page } from '@playwright/test';
import { TIMEOUT_CONFIG, WEB_CONFIG } from '../config';
import { registerAndLogin } from '../helpers/testHelpers';

const generateTestEmail = () =>
  `e2e-goal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.com`;
const testPassword = 'Test123456!';

test.describe('Goal CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page, {
      email: generateTestEmail(),
      password: testPassword,
      landingPath: '/goals',
    });

    await expect(page.getByTestId('goal-list-view')).toBeVisible({
      timeout: TIMEOUT_CONFIG.NAVIGATION,
    });
  });

  test('[P0] creates a goal from the stable list entry', async ({ page }) => {
    const goalName = `E2E Goal Create ${Date.now()}`;
    const goalDescription = 'Created from the default Goal CRUD oracle.';

    await createGoal(page, { name: goalName, description: goalDescription });

    const goalCard = await waitForGoalCardByName(page, goalName);
    await expect(goalCard.getByTestId('goal-card-title')).toHaveText(goalName);
    await expect(goalCard).toContainText(goalDescription);
  });

  test('[P0] edits a goal through the card action menu', async ({ page }) => {
    const originalName = `E2E Goal Edit ${Date.now()}`;
    const updatedName = `Updated Goal ${Date.now()}`;
    const updatedDescription = 'Updated through the card action menu.';

    const createdCard = await createGoal(page, {
      name: originalName,
      description: 'Original description.',
    });
    const goalId = await goalIdFromCard(createdCard);

    await openGoalAction(page, goalId, 'edit');

    const dialog = goalDialog(page);
    await expect(dialog).toBeVisible({ timeout: TIMEOUT_CONFIG.ELEMENT_WAIT });

    await page.getByTestId('goal-name-input').fill(updatedName);
    await page.getByTestId('goal-description-input').fill(updatedDescription);
    await goalSubmitButton(page).click();

    await expect(dialog).toBeHidden({ timeout: TIMEOUT_CONFIG.ELEMENT_WAIT });

    const updatedCard = goalCardById(page, goalId);
    await expect(updatedCard).toBeVisible({ timeout: TIMEOUT_CONFIG.ELEMENT_WAIT });
    await expect(updatedCard.getByTestId('goal-card-title')).toHaveText(updatedName);
    await expect(updatedCard).toContainText(updatedDescription);
  });

  test('[P0] deletes a goal through the card action menu', async ({ page }) => {
    const goalName = `E2E Goal Delete ${Date.now()}`;

    const createdCard = await createGoal(page, {
      name: goalName,
      description: 'This goal should be deleted.',
    });
    const goalId = await goalIdFromCard(createdCard);

    await openGoalAction(page, goalId, 'delete');

    const confirmDialog = page.getByRole('alertdialog');
    await expect(confirmDialog).toBeVisible({ timeout: TIMEOUT_CONFIG.ELEMENT_WAIT });
    await page.getByRole('button', { name: /Delete|删除/i }).click();
    await expect(confirmDialog).toBeHidden({ timeout: TIMEOUT_CONFIG.ELEMENT_WAIT });

    await expect
      .poll(async () => await goalCardById(page, goalId).count(), {
        timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
        message: `Timed out waiting for goal ${goalId} to be removed from the list.`,
      })
      .toBe(0);
  });

  test('[P1] opens goal detail from the card title', async ({ page }) => {
    const goalName = `E2E Goal Detail ${Date.now()}`;
    const goalDescription = 'Goal detail view should show this description.';

    const createdCard = await createGoal(page, {
      name: goalName,
      description: goalDescription,
    });
    const goalId = await goalIdFromCard(createdCard);

    await createdCard.getByTestId('goal-card-title').click();

    await page.waitForURL(new RegExp(`/goals/${goalId}$`), {
      timeout: TIMEOUT_CONFIG.NAVIGATION,
    });
    await expect(page.getByTestId('goal-detail')).toBeVisible({
      timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
    });
    await expect(page.getByTestId('goal-detail-title')).toHaveText(goalName);
    await expect(page.getByTestId('goal-detail')).toContainText(goalDescription);
  });

  test('[P0] keeps one primary create action and preserves toolbar state while resizing', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    const toolbar = page.getByTestId('goal-page-toolbar');
    const searchInput = page.getByTestId('goal-search-input');
    const primaryCreate = page.locator('[data-primary-action="create-goal"]:visible');
    await expect(toolbar).toBeVisible();
    await expect(primaryCreate).toHaveCount(1);
    await expectToolbarToFit(toolbar);

    await searchInput.fill('layout-state-probe');
    await searchInput.focus();
    await toolbar.evaluate((element) => {
      element.setAttribute('data-instance-probe', 'stable');
    });

    const scrollViewport = page
      .getByTestId('goal-list-scroll')
      .locator('[data-radix-scroll-area-viewport]');
    await expect(scrollViewport).toBeVisible();
    await scrollViewport.evaluate((element) => {
      const filler = document.createElement('div');
      filler.style.height = '1200px';
      filler.dataset.layoutProbe = 'filler';
      element.appendChild(filler);
      element.scrollTop = 96;
    });

    await dragBusinessPanel(page, 'wider');
    await expect(primaryCreate).toHaveCount(1);
    await expect(toolbar).toHaveAttribute('data-instance-probe', 'stable');
    await expect(searchInput).toHaveValue('layout-state-probe');
    await expect(searchInput).toBeFocused();
    expect(await scrollViewport.evaluate((element) => element.scrollTop)).toBe(96);
    await expectToolbarToFit(toolbar);

    await dragBusinessPanel(page, 'narrower');
    await expect(primaryCreate).toHaveCount(1);
    await expect(toolbar).toHaveAttribute('data-instance-probe', 'stable');
    await expect(searchInput).toHaveValue('layout-state-probe');
    expect(await scrollViewport.evaluate((element) => element.scrollTop)).toBe(96);
    await expectToolbarToFit(toolbar);

    await page.getByTestId('business-panel-focus-toggle').click();
    await expect(page.getByTestId('app-shell')).toHaveAttribute('data-shell-state', 'focus');
    await expect(primaryCreate).toHaveCount(1);
    await expect(toolbar).toHaveAttribute('data-instance-probe', 'stable');
    await expect(searchInput).toHaveValue('layout-state-probe');
    expect(await scrollViewport.evaluate((element) => element.scrollTop)).toBe(96);
    await expectToolbarToFit(toolbar);
  });
});

async function expectToolbarToFit(toolbar: Locator): Promise<void> {
  const metrics = await toolbar.evaluate((element) => ({
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

async function createGoal(
  page: Page,
  data: {
    name: string;
    description: string;
  },
): Promise<Locator> {
  await openCreateGoalDialog(page);

  const dialog = goalDialog(page);
  // Prefer stable testids (sync helpers); role+accessible name still depends on i18n labels.
  await page.getByTestId('goal-name-input').fill(data.name);
  await page.getByTestId('goal-description-input').fill(data.description);
  await goalSubmitButton(page).click();
  await expect(dialog).toBeHidden({ timeout: TIMEOUT_CONFIG.ELEMENT_WAIT });

  return waitForGoalCardByName(page, data.name);
}

async function openCreateGoalDialog(page: Page): Promise<void> {
  const stableCreateEntry = page.getByTestId('create-goal-entry');
  if (await stableCreateEntry.isVisible().catch(() => false)) {
    await stableCreateEntry.click();
  } else {
    await page.goto(WEB_CONFIG.getFullUrl('/goals?dialog=goal'), {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUT_CONFIG.NAVIGATION,
    });
  }

  await expect(goalDialog(page)).toBeVisible({
    timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
  });
}

function goalDialog(page: Page): Locator {
  return page.getByTestId('goal-dialog');
}

function goalSubmitButton(page: Page): Locator {
  return page.getByTestId('save-goal-button');
}

async function waitForGoalCardByName(page: Page, goalName: string): Promise<Locator> {
  const card = page
    .getByTestId('goal-card')
    .filter({ has: page.getByText(goalName, { exact: true }) })
    .first();

  await expect(card).toBeVisible({ timeout: TIMEOUT_CONFIG.ELEMENT_WAIT });
  return card;
}

function goalCardById(page: Page, goalId: string): Locator {
  return page.locator(`[data-testid="goal-card"][data-goal-id="${goalId}"]`);
}

async function goalIdFromCard(goalCard: Locator): Promise<string> {
  const goalId = await goalCard.getAttribute('data-goal-id');
  expect(goalId).toBeTruthy();
  return goalId!;
}

async function openGoalAction(
  page: Page,
  goalId: string,
  action: 'edit' | 'delete',
): Promise<void> {
  const card = goalCardById(page, goalId);
  await expect(card).toBeVisible({ timeout: TIMEOUT_CONFIG.ELEMENT_WAIT });
  await card.hover();

  await page.getByTestId(`goal-card-menu-trigger-${goalId}`).click();
  await page.getByTestId(`goal-card-${action}-action-${goalId}`).click();
}
