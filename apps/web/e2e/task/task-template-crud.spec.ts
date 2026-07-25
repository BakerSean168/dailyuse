import { test, expect, type Locator, type Page } from '@playwright/test';
import { TIMEOUT_CONFIG } from '../config';
import { registerAndLogin } from '../helpers/testHelpers';

const generateTestEmail = () =>
  `e2e-task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.com`;
const testPassword = 'Test123456!';

test.describe('Task Template CRUD Operations', () => {
  let testEmail: string;

  test.beforeEach(async ({ page }) => {
    testEmail = generateTestEmail();

    await registerAndLogin(page, {
      email: testEmail,
      password: testPassword,
      landingPath: '/tasks',
    });

    await expect(page.locator('#task-template-management')).toBeVisible({
      timeout: TIMEOUT_CONFIG.NAVIGATION,
    });
  });

  test('should create a new task template', async ({ page }) => {
    const templateTitle = `E2E Task Template ${Date.now()}`;

    const creation = await createTaskTemplate(page, templateTitle);

    await expect(taskCardByTitle(page, templateTitle)).toBeVisible();
    await expect(taskCardByTitle(page, templateTitle)).toContainText(
      /优先级\s+\d+\/100|Priority\s+\d+\/100/i,
    );
    expect(creation.instanceCount).toBeGreaterThanOrEqual(0);
    expect(typeof creation.todayInstanceCreated).toBe('boolean');
    await expect(
      page.getByText(
        creation.todayInstanceCreated
          ? /已生成今日任务实例|today's task instance generated/i
          : /今日没有生成任务实例|no task instance was generated for today/i,
      ),
    ).toBeVisible();
  });

  test('should display task template list', async ({ page }) => {
    await expect(page.locator('#task-template-management')).toBeVisible();
    await expect(page.getByTestId('create-task-template-button')).toBeVisible();
  });

  test('should edit an existing task template', async ({ page }) => {
    const originalTitle = `E2E Edit Task ${Date.now()}`;
    const updatedTitle = `${originalTitle} Updated`;

    await createTaskTemplate(page, originalTitle);

    const taskId = await openTaskCardMenu(page, originalTitle);
    await page.getByTestId(`task-card-edit-action-${taskId}`).click();

    await expect(taskTitleInput(page)).toBeVisible({ timeout: TIMEOUT_CONFIG.ELEMENT_WAIT });
    const saveButton = taskPrimaryActionButton(page);

    await taskTitleInput(page).fill(updatedTitle);
    await expect(saveButton).toBeEnabled({ timeout: TIMEOUT_CONFIG.ELEMENT_WAIT });

    const patchResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/task-templates/') && response.request().method() === 'PATCH',
      { timeout: TIMEOUT_CONFIG.ELEMENT_WAIT },
    );
    await saveButton.click();
    const patchResponse = await patchResponsePromise;
    expect(
      patchResponse.ok(),
      `Expected task template update to succeed, got ${patchResponse.status()}`,
    ).toBeTruthy();

    await expect(page.getByTestId('task-template-dialog')).toBeHidden({
      timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
    });
    await expect(taskCardByTitle(page, updatedTitle)).toBeVisible();
    await expect(taskCardByTitle(page, originalTitle)).toHaveCount(0);
  });

  test('should delete a task template', async ({ page }) => {
    const templateTitle = `E2E Delete Task ${Date.now()}`;

    await createTaskTemplate(page, templateTitle);

    const taskId = await openTaskCardMenu(page, templateTitle);
    await page.getByTestId(`task-card-delete-action-${taskId}`).click();

    const confirmDialog = page.getByRole('alertdialog');
    await expect(confirmDialog).toBeVisible({ timeout: TIMEOUT_CONFIG.ELEMENT_WAIT });
    await confirmDialog.getByRole('button', { name: /确认|confirm/i }).click();

    await expect(taskCardByTitle(page, templateTitle)).toHaveCount(0);
  });

  test('should require a title before allowing save', async ({ page }) => {
    await openCreateTaskDialog(page);

    await expect(taskPrimaryActionButton(page)).toBeDisabled();
  });

  test('[P0] keeps one task toolbar DOM and filter state across panel layouts', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    const toolbar = page.getByTestId('task-page-toolbar');
    const searchInput = page.getByTestId('task-search-input');
    const primaryCreate = page.locator('[data-primary-action="create-task-template"]:visible');
    const scrollHost = page.locator('#task-template-management');

    await expect(toolbar).toBeVisible();
    await expect(primaryCreate).toHaveCount(1);
    await expectToolbarToFit(toolbar);
    await searchInput.fill('stable-task-filter');
    await searchInput.focus();
    await toolbar.evaluate((element) => element.setAttribute('data-instance-probe', 'stable'));
    await scrollHost.evaluate((element) => {
      const filler = document.createElement('div');
      filler.style.height = '1200px';
      filler.dataset.layoutProbe = 'filler';
      element.appendChild(filler);
      element.scrollTop = 96;
    });

    await dragBusinessPanel(page, 'wider');
    await expect(primaryCreate).toHaveCount(1);
    await expect(toolbar).toHaveAttribute('data-instance-probe', 'stable');
    await expect(searchInput).toHaveValue('stable-task-filter');
    await expect(searchInput).toBeFocused();
    expect(await scrollHost.evaluate((element) => element.scrollTop)).toBe(96);
    await expectToolbarToFit(toolbar);

    await dragBusinessPanel(page, 'narrower');
    await expect(primaryCreate).toHaveCount(1);
    await expect(toolbar).toHaveAttribute('data-instance-probe', 'stable');
    await expect(searchInput).toHaveValue('stable-task-filter');
    expect(await scrollHost.evaluate((element) => element.scrollTop)).toBe(96);
    await expectToolbarToFit(toolbar);

    await page.getByTestId('business-panel-focus-toggle').click();
    await expect(page.getByTestId('app-shell')).toHaveAttribute('data-shell-state', 'focus');
    await expect(primaryCreate).toHaveCount(1);
    await expect(toolbar).toHaveAttribute('data-instance-probe', 'stable');
    await expect(searchInput).toHaveValue('stable-task-filter');
    expect(await scrollHost.evaluate((element) => element.scrollTop)).toBe(96);
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

async function openCreateTaskDialog(page: Page) {
  const primaryCreateButton = page.getByTestId('create-task-template-button');
  await primaryCreateButton.click();

  await expect(page.getByTestId('task-template-dialog')).toBeVisible({
    timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
  });
  await expect(taskTitleInput(page)).toBeVisible({
    timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
  });
}

async function createTaskTemplate(page: Page, title: string) {
  await openCreateTaskDialog(page);
  const saveButton = taskPrimaryActionButton(page);

  await taskTitleInput(page).fill(title);
  await taskDescriptionInput(page).fill(`Description for ${title}`);
  await expect(saveButton).toBeEnabled({ timeout: TIMEOUT_CONFIG.ELEMENT_WAIT });

  const createResponsePromise = page.waitForResponse(
    (response) =>
      /\/task-templates\/?(\?|$)/.test(new URL(response.url()).pathname) &&
      response.request().method() === 'POST' &&
      !response.url().includes('/activate') &&
      !response.url().includes('/pause') &&
      !response.url().includes('/archive') &&
      !response.url().includes('/generate-instances') &&
      !response.url().includes('/bind-goal') &&
      !response.url().includes('/unbind-goal'),
    { timeout: TIMEOUT_CONFIG.ELEMENT_WAIT },
  );
  await saveButton.click();
  const createResponse = await createResponsePromise;
  if (!createResponse.ok()) {
    const body = await createResponse.text();
    throw new Error(
      `Task template create failed: ${createResponse.status()} ${body.slice(0, 500)}`,
    );
  }
  const responseBody = (await createResponse.json()) as {
    data?: { instanceCount?: number; todayInstanceCreated?: boolean };
    instanceCount?: number;
    todayInstanceCreated?: boolean;
  };
  const creation = responseBody.data ?? responseBody;

  await expect(page.getByTestId('task-template-dialog')).toBeHidden({
    timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
  });
  await expect(taskCardByTitle(page, title)).toBeVisible();
  return {
    instanceCount: creation.instanceCount ?? 0,
    todayInstanceCreated: creation.todayInstanceCreated ?? false,
  };
}

function taskTitleInput(page: Page): Locator {
  return page.getByTestId('task-template-title-input');
}

function taskDescriptionInput(page: Page): Locator {
  return page.getByTestId('task-template-description-input');
}

function taskPrimaryActionButton(page: Page): Locator {
  return page.getByTestId('task-dialog-save-button');
}

function taskCardByTitle(page: Page, title: string): Locator {
  return page
    .locator('[data-testid="draggable-task-card"]')
    .filter({ has: page.getByText(title, { exact: true }) })
    .first();
}

async function openTaskCardMenu(page: Page, title: string): Promise<string> {
  const card = taskCardByTitle(page, title);
  await expect(card).toBeVisible();

  const taskId = await card.getAttribute('data-task-id');
  if (!taskId) {
    throw new Error(`Task card id not found for "${title}"`);
  }

  await card.hover();
  await page.getByTestId(`task-card-menu-trigger-${taskId}`).click();
  return taskId;
}
