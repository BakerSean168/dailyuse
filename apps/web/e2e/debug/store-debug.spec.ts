import { test } from '@playwright/test';
import { login, TEST_USER } from '../helpers/testHelpers';
import { WEB_CONFIG } from '../config';

test('Store 状态调试', async ({ page }) => {
  console.log('\n========== Store 调试测试 ==========\n');

  // 启用控制台日志
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('LoginService') || 
        text.includes('AccountStore') ||
        text.includes('identityId') ||
        text.includes('用户信息')) {
      console.log('浏览器:', text);
    }
  });

  console.log('1. 登录...');
  await login(page, TEST_USER.username, TEST_USER.password);

  console.log('\n2. 等待登录完成...');
  await page.waitForTimeout(2000);

  console.log('\n3. 检查 localStorage...');
  const localStorage = await page.evaluate(() => {
    return {
      accessToken: localStorage.getItem('accessToken') ? '存在' : '不存在',
      currentAccount: localStorage.getItem('currentAccount') ? JSON.parse(localStorage.getItem('currentAccount')!) : null,
    };
  });
  console.log('localStorage accessToken:', localStorage.accessToken);
  console.log('localStorage currentAccount:', localStorage.currentAccount);

  console.log('\n4. 尝试创建目标...');
  await page.goto(WEB_CONFIG.getFullUrl('/goals'), { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const createButton = page.locator('button:has-text("创建目标")').first();
  await createButton.click();
  await page.waitForTimeout(1000);

  console.log('\n========== 调试完成 ==========\n');
});
