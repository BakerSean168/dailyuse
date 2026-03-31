import { test, expect } from '@playwright/test';
import { login, TEST_USER } from '../helpers/testHelpers';
import { WEB_CONFIG, TIMEOUT_CONFIG } from '../config';

test('Goal 编辑对话框调试', async ({ page }) => {
  console.log('登录...');
  await login(page, TEST_USER.username, TEST_USER.password);

  console.log('导航到 Goals 页面...');
  await page.goto(WEB_CONFIG.getFullUrl('/goals'), {
    waitUntil: 'networkidle',
  });

  await page.waitForTimeout(2000);

  console.log('创建测试目标...');
  const createButton = page.locator('button:has-text("创建目标")').first();
  await createButton.click();
  await page.waitForTimeout(1000);

  const nameInput = page.locator('input[placeholder="一段话来描述自己的目标"]');
  await nameInput.fill('Edit Test Goal');

  const saveButton = page.locator('button:has-text("完成")');
  await saveButton.click();
  await page.waitForTimeout(2000);

  console.log('点击编辑按钮...');
  const goalCards = page.locator('.goal-card, .v-card').filter({ hasText: 'Edit Test Goal' });
  const editButton = goalCards.locator('button:has-text("编辑")').first();
  await editButton.click();

  // 等待对话框打开
  await page.waitForTimeout(2000);

  // 截图
  await page.screenshot({ path: '/workspaces/Memoflow/goal-edit-dialog-debug.png', fullPage: true });
  console.log('编辑对话框截图已保存');

  // 检查对话框是否存在
  const dialogCount = await page.locator('.v-dialog').count();
  console.log(`对话框数量: ${dialogCount}`);

  // 打印所有按钮
  const buttons = await page.locator('button').allTextContents();
  console.log('所有按钮:', buttons);

  // 打印对话框内所有input
  const inputs = await page.locator('input, textarea').evaluateAll((elements) =>
    elements.map((el) => ({
      tag: el.tagName,
      placeholder: el.getAttribute('placeholder'),
      value: (el as HTMLInputElement).value,
      visible: el.offsetParent !== null,
    }))
  );

  console.log('输入字段总数:', inputs.length);
  console.log('输入字段详情:');
  console.log(JSON.stringify(inputs.filter(i => i.visible), null, 2));

  // 检查 v-dialog 内的输入框
  const dialogInputs = await page.locator('.v-dialog input, .v-dialog textarea').count();
  console.log(`对话框内输入框数量: ${dialogInputs}`);
});
