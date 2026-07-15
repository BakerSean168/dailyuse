import { expect, test, type Locator, type Page } from '@playwright/test';
import { TIMEOUT_CONFIG } from '../config';
import { registerAndLogin } from '../helpers/testHelpers';

const testPassword = 'Test123456!';

test.describe('Note workspace', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page, {
      email: `e2e-note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.com`,
      password: testPassword,
      landingPath: '/repository',
    });

    await expect(page.getByTestId('repository-workspace-view')).toBeVisible({
      timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
    });
  });

  test('[P0] creates an immediately editable note from the only primary action', async ({
    page,
  }) => {
    const primaryCreate = page.locator('[data-primary-action="create-note"]:visible');

    await expect(primaryCreate).toHaveCount(1);
    await expect(primaryCreate).toBeEnabled({ timeout: TIMEOUT_CONFIG.ELEMENT_WAIT });
    await primaryCreate.click();

    await expect(page.getByTestId('active-document-pane')).toBeVisible({
      timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
    });
    await expect(page.locator('.cm-content')).toBeFocused({
      timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
    });

    await page.keyboard.type('Stable note workspace content');
    await expect(page.locator('.cm-content')).toContainText('Stable note workspace content');
  });

  test('[P0] keeps one toolbar and the same editor DOM, focus, content, and scroll across layouts', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    const toolbar = page.getByTestId('note-page-toolbar');
    const sidebar = page.getByTestId('repository-group-sidebar');
    const editorPane = page.getByTestId('repository-editor-pane');
    const primaryCreate = page.locator('[data-primary-action="create-note"]:visible');

    await expect(toolbar).toBeVisible();
    await expect(primaryCreate).toHaveCount(1);
    await expect(primaryCreate).toBeEnabled({ timeout: TIMEOUT_CONFIG.ELEMENT_WAIT });
    await expectElementToFit(toolbar);

    await primaryCreate.click();
    const editorHost = page.getByTestId('markdown-editor-host');
    const editorContent = page.locator('.cm-content');
    const editorScroller = page.locator('.cm-scroller');
    await expect(editorHost).toBeVisible({ timeout: TIMEOUT_CONFIG.ELEMENT_WAIT });
    await expect(editorContent).toBeFocused({ timeout: TIMEOUT_CONFIG.ELEMENT_WAIT });
    await editorContent.fill(
      Array.from({ length: 80 }, (_, index) => `Persistent editor state line ${index + 1}`).join(
        '\n',
      ),
    );

    await markDomIdentity(toolbar, 'toolbar');
    await markDomIdentity(sidebar, 'sidebar');
    await markDomIdentity(editorPane, 'editor');
    const editorScrollTop = await editorScroller.evaluate((element) => {
      element.scrollTop = Math.min(96, element.scrollHeight - element.clientHeight);
      return element.scrollTop;
    });
    expect(editorScrollTop).toBeGreaterThan(0);

    await dragBusinessPanel(page, 'wider');
    await assertStableWorkspace({
      toolbar,
      sidebar,
      editorPane,
      primaryCreate,
      editorContent,
      editorScroller,
      editorScrollTop,
    });
    await expect(editorContent).toBeFocused();

    await dragBusinessPanel(page, 'narrower');
    await assertStableWorkspace({
      toolbar,
      sidebar,
      editorPane,
      primaryCreate,
      editorContent,
      editorScroller,
      editorScrollTop,
    });
    await expect(editorContent).toBeFocused();

    await page.getByTestId('business-panel-focus-toggle').click();
    await expect(page.getByTestId('app-shell')).toHaveAttribute('data-shell-state', 'focus');
    await assertStableWorkspace({
      toolbar,
      sidebar,
      editorPane,
      primaryCreate,
      editorContent,
      editorScroller,
      editorScrollTop,
    });
    await expectElementToFit(toolbar);
    await expectElementToFit(page.getByTestId('repository-workspace-grid'));
  });
});

async function markDomIdentity(locator: Locator, value: string): Promise<void> {
  await locator.evaluate((element, marker) => {
    element.setAttribute('data-instance-probe', marker);
  }, value);
}

async function assertStableWorkspace({
  toolbar,
  sidebar,
  editorPane,
  primaryCreate,
  editorContent,
  editorScroller,
  editorScrollTop,
}: {
  toolbar: Locator;
  sidebar: Locator;
  editorPane: Locator;
  primaryCreate: Locator;
  editorContent: Locator;
  editorScroller: Locator;
  editorScrollTop: number;
}): Promise<void> {
  await expect(primaryCreate).toHaveCount(1);
  await expect(toolbar).toHaveAttribute('data-instance-probe', 'toolbar');
  await expect(sidebar).toHaveAttribute('data-instance-probe', 'sidebar');
  await expect(editorPane).toHaveAttribute('data-instance-probe', 'editor');
  await expect(editorContent).toContainText('Persistent editor state line 80');
  expect(await editorScroller.evaluate((element) => element.scrollTop)).toBe(editorScrollTop);
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
