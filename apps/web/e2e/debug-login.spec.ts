import { test } from '@playwright/test';

test('debug login flow', async ({ page }) => {
  const baseUrl = 'http://localhost:5173';
  const testUsername = 'Test123123';
  const testPassword = 'Llh123123!';

  console.log('1. 导航到登录页...');
  await page.goto(`${baseUrl}/auth`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  console.log('2. 当前 URL:', page.url());
  console.log('3. 页面标题:', await page.title());
  
  // 截图
  await page.screenshot({ path: 'test-results/debug-01-login-page.png', fullPage: true });
  
  console.log('4. 查找用户名输入框...');
  const usernameField = page.locator('[data-testid="login-username-input"] input');
  await usernameField.waitFor({ state: 'visible', timeout: 10000 });
  console.log('5. 找到用户名输入框');
  
  console.log('6. 填写用户名...');
  await usernameField.fill(testUsername);
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'test-results/debug-02-username-filled.png', fullPage: true });
  
  console.log('7. 查找密码输入框...');
  const passwordField = page.locator('[data-testid="login-password-input"] input');
  await passwordField.waitFor({ state: 'visible', timeout: 10000 });
  console.log('8. 找到密码输入框');
  
  console.log('9. 填写密码...');
  await passwordField.fill(testPassword);
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'test-results/debug-03-password-filled.png', fullPage: true });
  
  console.log('10. 查找登录按钮...');
  const loginButton = page.locator('[data-testid="login-submit-button"]');
  await loginButton.waitFor({ state: 'visible', timeout: 10000 });
  console.log('11. 找到登录按钮，准备点击...');
  
  console.log('12. 点击登录按钮...');
  await loginButton.click();
  await page.waitForTimeout(2000);
  
  console.log('13. 点击后 URL:', page.url());
  await page.screenshot({ path: 'test-results/debug-04-after-login-click.png', fullPage: true });
  
  // 检查是否有错误消息
  const errors = await page.locator('.v-messages__message, [role="alert"]').allTextContents();
  if (errors.length > 0) {
    console.log('14. 发现错误消息:', errors);
  } else {
    console.log('14. 没有发现错误消息');
  }
  
  // 等待一段时间看URL是否变化
  console.log('15. 等待 URL 变化...');
  try {
    await page.waitForURL((url) => !url.pathname.includes('/auth'), { timeout: 10000 });
    console.log('16. 成功！新 URL:', page.url());
    await page.screenshot({ path: 'test-results/debug-05-success.png', fullPage: true });
  } catch {
    console.log('16. 超时！仍在:', page.url());
    await page.screenshot({ path: 'test-results/debug-05-timeout.png', fullPage: true });
    
    // 获取控制台日志
    page.on('console', msg => console.log('浏览器控制台:', msg.text()));
  }
});
