import { test } from '@playwright/test';

test('Debug: 查看登录后的任务页面', async ({ page }) => {
  // 1. 登录
  await page.goto('http://localhost:5173/auth');
  await page.locator('[data-testid="login-username-input"] input').fill('Test123123');
  await page.locator('[data-testid="login-password-input"] input').fill('Llh123123!');
  await page.locator('button[type="submit"]').click();
  
  // 2. 等待跳转完成
  await page.waitForTimeout(3000);
  
  console.log('当前 URL:', page.url());
  console.log('页面标题:', await page.title());
  
  // 3. 尝试导航到任务页面
  console.log('\n尝试导航到 /task...');
  await page.goto('http://localhost:5173/task');
  await page.waitForTimeout(2000);
  
  console.log('任务页面 URL:', page.url());
  console.log('任务页面标题:', await page.title());
  
  // 4. 查看页面上的按钮
  const buttons = await page.locator('button').all();
  console.log(`\n找到 ${buttons.length} 个按钮:`);
  for (let i = 0; i < Math.min(buttons.length, 10); i++) {
    const text = await buttons[i].textContent();
    const visible = await buttons[i].isVisible();
    console.log(`  按钮 ${i+1}: "${text}" (可见: ${visible})`);
  }
  
  // 5. 查看页面上的标题文本
  const headings = await page.locator('h1, h2, h3, .v-card-title').all();
  console.log(`\n找到 ${headings.length} 个标题:`);
  for (let i = 0; i < Math.min(headings.length, 10); i++) {
    const text = await headings[i].textContent();
    console.log(`  标题 ${i+1}: "${text}"`);
  }
  
  // 6. 截图
  await page.screenshot({ path: 'test-results/debug-task-page.png', fullPage: true });
  console.log('\n截图已保存到: test-results/debug-task-page.png');
});
