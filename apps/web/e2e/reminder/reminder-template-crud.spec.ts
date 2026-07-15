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
    await expect(page.getByTestId('reminder-linear-heading')).toBeVisible();
    await expect(page.getByTestId('create-reminder-template-button')).toBeVisible();
  });

  test('[P0] keeps one reminder workspace and filter state across panel layouts', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    const toolbar = page.getByTestId('reminder-page-toolbar');
    const sidebar = page.getByTestId('reminder-group-sidebar');
    const content = page.getByTestId('reminder-content');
    const searchInput = page.getByTestId('reminder-search-input');
    const scrollHost = page.getByTestId('reminder-scroll-host');
    const primaryCreate = page.locator(
      '[data-primary-action="create-reminder-template"]:visible',
    );

    await expect(toolbar).toBeVisible();
    await expect(primaryCreate).toHaveCount(1);
    await expectElementToFit(toolbar);
    await searchInput.fill('stable-reminder-filter');
    await searchInput.focus();
    await markDomIdentity(toolbar, 'toolbar');
    await markDomIdentity(sidebar, 'sidebar');
    await markDomIdentity(content, 'content');
    await scrollHost.evaluate((element) => {
      const filler = document.createElement('div');
      filler.style.height = '1200px';
      filler.dataset.layoutProbe = 'filler';
      element.appendChild(filler);
      element.scrollTop = 96;
    });

    await dragBusinessPanel(page, 'wider');
    await assertStableReminderWorkspace({
      toolbar,
      sidebar,
      content,
      searchInput,
      scrollHost,
      primaryCreate,
    });
    await expect(searchInput).toBeFocused();

    await dragBusinessPanel(page, 'narrower');
    await assertStableReminderWorkspace({
      toolbar,
      sidebar,
      content,
      searchInput,
      scrollHost,
      primaryCreate,
    });
    await expect(searchInput).toBeFocused();

    await page.getByTestId('business-panel-focus-toggle').click();
    await expect(page.getByTestId('app-shell')).toHaveAttribute('data-shell-state', 'focus');
    await assertStableReminderWorkspace({
      toolbar,
      sidebar,
      content,
      searchInput,
      scrollHost,
      primaryCreate,
    });
    await expectElementToFit(toolbar);
    await expectElementToFit(page.getByTestId('reminder-linear-view'));
  });

  test('should edit an existing reminder template', async ({ page }) => {
    const originalTitle = `E2E Edit Reminder ${Date.now()}`;
    const updatedTitle = `${originalTitle} Updated`;

    await createReminderTemplate(page, originalTitle);

    const reminderId = await openReminderCardContextMenu(page, originalTitle);
    await page.getByTestId(`reminder-template-edit-action-${reminderId}`).click();

    const dialog = reminderDialog(page);
    await expect(dialog).toBeVisible();

    await dialog.getByTestId('reminder-template-title-input').fill(updatedTitle);
    await dialog.getByTestId('reminder-template-save-button').click();

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

    const detailDialog = page.getByTestId('reminder-template-detail');
    await expect(detailDialog).toBeVisible({
      timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
    });
    await expect(page.getByTestId('reminder-template-detail-title')).toHaveText(templateTitle);
  });
});

async function openCreateReminderDialog(page: Page) {
  const primaryCreateButton = page.getByTestId('create-reminder-template-button');
  await primaryCreateButton.click();

  await expect(reminderDialog(page)).toBeVisible({
    timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
  });
}

async function markDomIdentity(locator: Locator, value: string): Promise<void> {
  await locator.evaluate((element, marker) => {
    element.setAttribute('data-instance-probe', marker);
  }, value);
}

async function assertStableReminderWorkspace({
  toolbar,
  sidebar,
  content,
  searchInput,
  scrollHost,
  primaryCreate,
}: {
  toolbar: Locator;
  sidebar: Locator;
  content: Locator;
  searchInput: Locator;
  scrollHost: Locator;
  primaryCreate: Locator;
}): Promise<void> {
  await expect(primaryCreate).toHaveCount(1);
  await expect(toolbar).toHaveAttribute('data-instance-probe', 'toolbar');
  await expect(sidebar).toHaveAttribute('data-instance-probe', 'sidebar');
  await expect(content).toHaveAttribute('data-instance-probe', 'content');
  await expect(searchInput).toHaveValue('stable-reminder-filter');
  expect(await scrollHost.evaluate((element) => element.scrollTop)).toBe(96);
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

async function createReminderTemplate(page: Page, title: string) {
  await openCreateReminderDialog(page);
  const dialog = reminderDialog(page);

  await dialog.getByTestId('reminder-template-title-input').fill(title);
  await dialog.getByTestId('reminder-template-description-input').fill(`Description for ${title}`);
  await dialog.getByTestId('reminder-template-save-button').click();

  await expect(dialog).toBeHidden({
    timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
  });
  await expect(reminderCardByTitle(page, title)).toBeVisible();
}

function reminderDialog(page: Page): Locator {
  return page.getByTestId('reminder-template-dialog');
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
