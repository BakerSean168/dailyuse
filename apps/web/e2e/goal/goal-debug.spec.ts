import { test } from '@playwright/test';
import { login } from '../helpers/testHelpers';
import { WEB_CONFIG, TEST_USERS } from '../config';

test('Goal 对话框调试', async ({ page }) => {
  console.log('登录...');
  await login(page, TEST_USERS.MAIN.username, TEST_USERS.MAIN.password);

  console.log('导航到 Goals 页面...');
  await page.goto(WEB_CONFIG.getFullUrl('/goals'), {
    waitUntil: 'domcontentloaded',
  });

  await page.waitForTimeout(2000);

  console.log('点击"创建目标"按钮...');
  const createButton = page.locator('button:has-text("创建目标")').first();
  await createButton.click();

  // 等待对话框打开
  await page.waitForTimeout(2000);

  // 截图
  await page.screenshot({ path: '/workspaces/Memoflow/goal-dialog-debug.png', fullPage: true });
  console.log('✅ 对话框截图已保存');

  // 打印对话框内所有input和textarea
  const inputs = await page.locator('input, textarea').evaluateAll((elements) =>
    elements.map((el) => ({
      tag: el.tagName,
      type: el.getAttribute('type'),
      name: el.getAttribute('name'),
      placeholder: el.getAttribute('placeholder'),
      label: el.closest('.v-field')?.querySelector('label')?.textContent,
      id: el.id,
    }))
  );

  console.log('\\n========== 对话框中的输入字段 ==========');
  console.log(JSON.stringify(inputs, null, 2));

  // 查找所有label
  const labels = await page.locator('label').allTextContents();
  console.log('\\n========== 所有 Label 文本 ==========');
  console.log(labels);

  // 查找所有标签页
  const tabs = await page.locator('.v-tab, [role="tab"]').allTextContents();
  console.log('\\n========== 所有标签页 ==========');
  console.log(tabs);
});
