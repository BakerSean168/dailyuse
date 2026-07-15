import { test } from '@playwright/test';

test('详细探索登录页面', async ({ page }) => {
  const baseUrl = 'http://localhost:5173';
  
  console.log('访问首页，应该会跳转到登录页...');
  await page.goto(baseUrl);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(3000);
  
  console.log('当前 URL:', page.url());
  console.log('页面标题:', await page.title());
  
  // 获取页面的所有文本内容
  const bodyText = await page.locator('body').innerText();
  console.log('\n页面文本内容（前500字符）:');
  console.log(bodyText.substring(0, 500));
  
  // 查找所有输入框
  const inputs = await page.locator('input').all();
  console.log(`\n找到 ${inputs.length} 个输入框：`);
  for (let i = 0; i < inputs.length; i++) {
    const type = await inputs[i].getAttribute('type');
    const placeholder = await inputs[i].getAttribute('placeholder');
    const name = await inputs[i].getAttribute('name');
    const id = await inputs[i].getAttribute('id');
    console.log(`  ${i + 1}. type="${type}" name="${name}" id="${id}" placeholder="${placeholder}"`);
  }
  
  // 查找所有按钮
  const buttons = await page.locator('button').all();
  console.log(`\n找到 ${buttons.length} 个按钮：`);
  for (let i = 0; i < buttons.length; i++) {
    const text = await buttons[i].innerText().catch(() => '');
    const type = await buttons[i].getAttribute('type');
    console.log(`  ${i + 1}. text="${text}" type="${type}"`);
  }
  
  // 截图
  await page.screenshot({ path: 'test-results/login-page-detail.png', fullPage: true });
  console.log('\n截图已保存到 test-results/login-page-detail.png');
});
