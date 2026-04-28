import { test, expect, type Locator, type Page } from '@playwright/test';
import { TIMEOUT_CONFIG } from '../config';
import { registerAndLogin } from '../helpers/testHelpers';

const generateTestEmail = () =>
  `e2e-reminder-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.com`;
const testPassword = 'Test123456!';

test.describe('Reminder Template CRUD Operations', () => {
  let testEmail: string;

  test.beforeEach(async ({ page }) => {
    testEmail = generateTestEmail();

    await registerAndLogin(page, {
      email: testEmail,
      password: testPassword,
      landingPath: '/reminders',
    });

    await expect(page.getByTestId('create-reminder-template-button')).toBeVisible({
      timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
    });
  });

  test('should create a new reminder template', async ({ page }) => {
    const templateTitle = `E2E Reminder ${Date.now()}`;

    await createReminderTemplate(page, templateTitle);

    await expect(reminderCardByTitle(page, templateTitle)).toBeVisible();
  });

  test('should display reminder templates', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /reminder/i }).first()).toBeVisible();
    await expect(page.getByTestId('create-reminder-template-button')).toBeVisible();
  });

  test('should edit an existing reminder template', async ({ page }) => {
    const originalTitle = `E2E Edit Reminder ${Date.now()}`;
    const updatedTitle = `${originalTitle} Updated`;

    await createReminderTemplate(page, originalTitle);

    const reminderId = await openReminderCardContextMenu(page, originalTitle);
    await page.getByTestId(`reminder-template-edit-action-${reminderId}`).click();

    const dialog = reminderDialog(page, /edit reminder template/i);
    await expect(dialog).toBeVisible();

    await dialog.getByRole('textbox', { name: /title/i }).fill(updatedTitle);
    await dialog.getByRole('button', { name: /done/i }).click();

    await expect(dialog).toBeHidden({ timeout: TIMEOUT_CONFIG.ELEMENT_WAIT });
    await expect(reminderCardByTitle(page, updatedTitle)).toBeVisible();
    await expect(reminderCardByTitle(page, originalTitle)).toHaveCount(0);
  });

  test('should delete a reminder template', async ({ page }) => {
    const templateTitle = `E2E Delete Reminder ${Date.now()}`;

    await createReminderTemplate(page, templateTitle);

    const reminderId = await openReminderCardContextMenu(page, templateTitle);
    await page.getByTestId(`reminder-template-delete-action-${reminderId}`).click();

    const confirmDialog = page.getByRole('alertdialog');
    await expect(confirmDialog).toBeVisible({ timeout: TIMEOUT_CONFIG.ELEMENT_WAIT });
    await confirmDialog.getByRole('button', { name: /delete|删除/i }).click();

    await expect(reminderCardByTitle(page, templateTitle)).toHaveCount(0);
  });

  test('should open reminder template detail', async ({ page }) => {
    const templateTitle = `E2E Detail Reminder ${Date.now()}`;

    await createReminderTemplate(page, templateTitle);

    await reminderCardByTitle(page, templateTitle).click();

    const detailDialog = page.getByRole('dialog', { name: new RegExp(templateTitle, 'i') });
    await expect(detailDialog).toBeVisible({
      timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
    });
    await expect(detailDialog.getByRole('heading', { name: templateTitle })).toBeVisible();
  });
});

async function openCreateReminderDialog(page: Page) {
  const primaryCreateButton = page.getByTestId('create-reminder-template-button');

  if (await primaryCreateButton.isVisible()) {
    await primaryCreateButton.click();
  } else {
    await page.getByTestId('create-first-reminder-template-button').click();
  }

  await expect(reminderDialog(page, /create reminder template/i)).toBeVisible({
    timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
  });
}

async function createReminderTemplate(page: Page, title: string) {
  await openCreateReminderDialog(page);
  const dialog = reminderDialog(page, /create reminder template/i);

  await dialog.getByRole('textbox', { name: /title/i }).fill(title);
  await dialog.getByRole('textbox', { name: /description/i }).fill(`Description for ${title}`);
  await dialog.getByRole('button', { name: /done/i }).click();

  await expect(dialog).toBeHidden({
    timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
  });
  await expect(reminderCardByTitle(page, title)).toBeVisible();
}

function reminderDialog(page: Page, name: RegExp): Locator {
  return page.getByRole('dialog', { name });
}

function reminderCardByTitle(page: Page, title: string): Locator {
  return page
    .locator('[data-testid="reminder-template-card"]')
    .filter({ has: page.getByText(title, { exact: true }) })
    .first();
}

async function openReminderCardContextMenu(page: Page, title: string): Promise<string> {
  const card = reminderCardByTitle(page, title);
  await expect(card).toBeVisible();

  const reminderId = await card.getAttribute('data-reminder-id');
  if (!reminderId) {
    throw new Error(`Reminder card id not found for "${title}"`);
  }

  await card.click({ button: 'right' });
  return reminderId;
}
