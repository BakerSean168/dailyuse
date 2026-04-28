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

    const dialog = taskDialog(page, /edit task template/i);
    await expect(dialog).toBeVisible();

    await dialog.getByRole('textbox', { name: /task title/i }).fill(updatedTitle);
    await dialog.getByRole('button', { name: /save changes/i }).click();

    await expect(dialog).toBeHidden({ timeout: TIMEOUT_CONFIG.ELEMENT_WAIT });
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
    await confirmDialog.getByRole('button', { name: /delete|删除/i }).click();

    await expect(taskCardByTitle(page, templateTitle)).toHaveCount(0);
  });

  test('should require a title before allowing save', async ({ page }) => {
    await openCreateTaskDialog(page);

    await expect(
      taskDialog(page, /create task template/i).getByRole('button', { name: /create template/i }),
    ).toBeDisabled();
  });
});

async function openCreateTaskDialog(page: Page) {
  const primaryCreateButton = page.getByTestId('create-task-template-button');

  if (await primaryCreateButton.isVisible()) {
    await primaryCreateButton.click();
  } else {
    await page.getByTestId('create-first-task-template-button').click();
  }

  await expect(taskDialog(page, /create task template/i)).toBeVisible({
    timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
  });
}

async function createTaskTemplate(page: Page, title: string) {
  await openCreateTaskDialog(page);
  const dialog = taskDialog(page, /create task template/i);

  await dialog.getByRole('textbox', { name: /task title/i }).fill(title);
  await dialog.getByRole('textbox', { name: /^description$/i }).fill(`Description for ${title}`);
  await dialog.getByRole('button', { name: /create template/i }).click();

  await expect(dialog).toBeHidden({
    timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
  });
  await expect(taskCardByTitle(page, title)).toBeVisible();
}

function taskDialog(page: Page, name: RegExp): Locator {
  return page.getByRole('dialog', { name });
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
