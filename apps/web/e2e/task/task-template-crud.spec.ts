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
      timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
    });
  });

  test('should create a new task template', async ({ page }) => {
    const templateTitle = `E2E Task Template ${Date.now()}`;

    await createTaskTemplate(page, templateTitle);

    await expect(taskCardByTitle(page, templateTitle)).toBeVisible();
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
    await saveButton.click();

    await expect(taskTitleInput(page)).toBeHidden({ timeout: TIMEOUT_CONFIG.ELEMENT_WAIT });
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
});

async function openCreateTaskDialog(page: Page) {
  const primaryCreateButton = page.getByTestId('create-task-template-button');

  if (await primaryCreateButton.isVisible()) {
    await primaryCreateButton.click();
  } else {
    await page.getByTestId('create-first-task-template-button').click();
  }

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
  await saveButton.click();

  await expect(taskTitleInput(page)).toBeHidden({
    timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
  });
  await expect(taskCardByTitle(page, title)).toBeVisible();
}

function taskTitleInput(page: Page): Locator {
  return page.getByRole('textbox', { name: /任务标题|task title/i });
}

function taskDescriptionInput(page: Page): Locator {
  return page.getByRole('textbox', { name: /任务描述|description/i });
}

function taskPrimaryActionButton(page: Page): Locator {
  return page.getByRole('button', { name: /创建模板|保存更改|create template|save changes/i });
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
