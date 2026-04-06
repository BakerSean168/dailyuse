/**
 * Authentication Login Debug - Test suite for debugging login issues.
 * Includes detailed logging and screenshots.
 */

import { test, expect } from '@playwright/test';
import { WEB_CONFIG, TIMEOUT_CONFIG, API_CONFIG, TEST_USERS } from '../config';

test.describe('Login Debug', () => {
  test.beforeEach(async ({ page }) => {
    console.log('\n' + '='.repeat(80));
    console.log('Login debug test starting');
    console.log('='.repeat(80));
    console.log(`API URL: ${API_CONFIG.FULL_URL}`);
    console.log(`Web URL: ${WEB_CONFIG.BASE_URL}`);
    console.log(`Test user: ${TEST_USERS.MAIN.username}`);
    console.log('='.repeat(80) + '\n');

    // Set up detailed network logging
    page.on('request', (request) => {
      if (request.url().includes('/api/')) {
        console.log(`📤 [REQUEST] ${request.method()} ${request.url()}`);
        if (request.postData()) {
          try {
            const data = JSON.parse(request.postData() || '{}');
            console.log(`   Body:`, JSON.stringify(data, null, 2));
          } catch {
            console.log(`   Body:`, request.postData());
          }
        }
      }
    });

    page.on('response', async (response) => {
      if (response.url().includes('/api/')) {
        const status = response.status();
        const statusEmoji = status >= 200 && status < 300 ? '✅' : '❌';
        console.log(`📥 [RESPONSE] ${statusEmoji} ${status} ${response.url()}`);

        try {
          const body = await response.text();
          if (body) {
            console.log(`   Response:`, body.substring(0, 500));
          }
        } catch {
          console.log(`   (Unable to read response body)`);
        }
      }
    });

    page.on('console', (msg) => {
      const type = msg.type();
      if (type === 'error' || type === 'warning') {
        console.log(`🖥️  [BROWSER ${type.toUpperCase()}]`, msg.text());
      }
    });

    page.on('pageerror', (error) => {
      console.log(`🖥️  [BROWSER PAGE ERROR]`, error.message);
    });
  });

  test('[DEBUG] Full login flow debug', async ({ page }) => {
    console.log('\nStep 1: Navigate to login page\n');

    await page.goto(WEB_CONFIG.getFullUrl(WEB_CONFIG.LOGIN_PATH), {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUT_CONFIG.NAVIGATION,
    });

    console.log(`   Current URL: ${page.url()}`);
    await page.screenshot({ path: '/tmp/01-login-page-loaded.png' });
    console.log('   Screenshot saved: /tmp/01-login-page-loaded.png');

    // Clear storage
    console.log('\nStep 2: Clear localStorage\n');
    await page.evaluate(() => {
      console.log('[Before clear] localStorage keys:', Object.keys(localStorage));
      localStorage.clear();
      sessionStorage.clear();
      console.log('[After clear] localStorage keys:', Object.keys(localStorage));
    });

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    console.log('   Page load complete');

    // Find login tab
    console.log('\nStep 3: Find and click login tab\n');

    const loginTab = page.locator('button.v-tab, [role="tab"]').filter({ hasText: /登录|Login/i });
    const loginTabCount = await loginTab.count();
    console.log(`   Found ${loginTabCount} login tab(s)`);

    if (loginTabCount > 0) {
      await loginTab.first().click();
      console.log('   Clicked login tab');
      await page.waitForTimeout(TIMEOUT_CONFIG.SHORT_WAIT);
    } else {
      console.log('   Login tab not found, may already be on the login form');
    }

    await page.screenshot({ path: '/tmp/02-login-tab-selected.png' });
    console.log('   Screenshot saved: /tmp/02-login-tab-selected.png');

    // Find username input
    console.log('\nStep 4: Locate username input\n');

    // Try multiple locator strategies
    const usernameStrategies = [
      {
        name: 'By label',
        locator: page.locator('label:has-text("用户名")').locator('..').locator('input'),
      },
      { name: 'By placeholder', locator: page.locator('input[placeholder*="用户名"]') },
      { name: 'By name attribute', locator: page.locator('input[name="username"]') },
      { name: 'By v-combobox', locator: page.locator('.v-combobox input') },
    ];

    let usernameInput = null;
    for (const strategy of usernameStrategies) {
      const count = await strategy.locator.count();
      console.log(`   ${strategy.name}: found ${count} element(s)`);
      if (count > 0 && (await strategy.locator.first().isVisible())) {
        usernameInput = strategy.locator.first();
        console.log(`   Using strategy: ${strategy.name}`);
        break;
      }
    }

    if (!usernameInput) {
      console.log('   Username input not found');
      await page.screenshot({ path: '/tmp/03-error-no-username-input.png' });
      throw new Error('Unable to find username input');
    }

    // Fill in username
    console.log(`\nStep 5: Fill username "${TEST_USERS.MAIN.username}"\n`);
    await usernameInput.click();
    await page.waitForTimeout(100);
    await usernameInput.fill(TEST_USERS.MAIN.username);
    const usernameValue = await usernameInput.inputValue();
    console.log(`   Input value: "${usernameValue}"`);

    if (usernameValue !== TEST_USERS.MAIN.username) {
      console.log('   Username fill may have failed, retrying');
      await usernameInput.clear();
      await usernameInput.fill(TEST_USERS.MAIN.username);
    }

    await page.screenshot({ path: '/tmp/04-username-filled.png' });
    console.log('   Screenshot saved: /tmp/04-username-filled.png');

    // Find password input
    console.log('\nStep 6: Locate password input\n');

    const passwordStrategies = [
      {
        name: 'By label',
        locator: page
          .locator('label:has-text("密码")')
          .locator('..')
          .locator('input[type="password"]'),
      },
      {
        name: 'By placeholder',
        locator: page.locator('input[type="password"][placeholder*="密码"]'),
      },
      {
        name: 'By name attribute',
        locator: page.locator('input[type="password"][name="password"]'),
      },
      { name: 'By type (first)', locator: page.locator('input[type="password"]').first() },
    ];

    let passwordInput = null;
    for (const strategy of passwordStrategies) {
      const count = await strategy.locator.count();
      console.log(`   ${strategy.name}: found ${count} element(s)`);
      if (count > 0 && (await strategy.locator.first().isVisible())) {
        passwordInput = strategy.locator.first();
        console.log(`   Using strategy: ${strategy.name}`);
        break;
      }
    }

    if (!passwordInput) {
      console.log('   Password input not found');
      await page.screenshot({ path: '/tmp/05-error-no-password-input.png' });
      throw new Error('Unable to find password input');
    }

    // Fill in password
    console.log(`\nStep 7: Fill password\n`);
    await passwordInput.click();
    await page.waitForTimeout(100);
    await passwordInput.fill(TEST_USERS.MAIN.password);
    console.log('   Password filled');

    await page.screenshot({ path: '/tmp/06-password-filled.png' });

    // Find login button
    console.log('\nStep 8: Find login button\n');

    const loginButtonStrategies = [
      {
        name: 'By type="submit" and text',
        locator: page.locator('button[type="submit"]:has-text("登录")'),
      },
      { name: 'By text', locator: page.locator('button:has-text("登录")') },
      { name: 'By data-testid', locator: page.locator('[data-testid="login-button"]') },
    ];

    let loginButton = null;
    for (const strategy of loginButtonStrategies) {
      const count = await strategy.locator.count();
      console.log(`   ${strategy.name}: found ${count} element(s)`);
      if (count > 0 && (await strategy.locator.first().isVisible())) {
        loginButton = strategy.locator.first();
        console.log(`   Using strategy: ${strategy.name}`);
        break;
      }
    }

    if (!loginButton) {
      console.log('   Login button not found');
      await page.screenshot({ path: '/tmp/07-error-no-login-button.png' });
      throw new Error('Unable to find login button');
    }

    // Click login button
    console.log('\nStep 9: Click login button\n');

    // Start listening for network requests
    const loginRequest = page
      .waitForRequest((req) => req.url().includes('/auth/login') || req.url().includes('/login'), {
        timeout: TIMEOUT_CONFIG.API_REQUEST,
      })
      .catch(() => null);

    await loginButton.click();
    console.log('   Clicked login button');

    // Wait for network request
    console.log('   Waiting for login API request...');
    const request = await loginRequest;

    if (request) {
      console.log(`   Detected login request: ${request.url()}`);
    } else {
      console.log('   No login API request detected');
    }

    // Wait for response
    await page.waitForTimeout(TIMEOUT_CONFIG.LONG_WAIT);
    await page.screenshot({ path: '/tmp/08-after-login-click.png' });
    console.log('   Screenshot saved: /tmp/08-after-login-click.png');

    // Check for error messages
    console.log('\nStep 10: Check login result\n');

    const errorSnackbar = page.locator('.v-snackbar:visible, [role="alert"]:visible');
    const hasError = await errorSnackbar.isVisible().catch(() => false);

    if (hasError) {
      const errorText = await errorSnackbar.textContent();
      console.log(`   Error message found: "${errorText}"`);
      await page.screenshot({ path: '/tmp/09-login-error.png' });
    }

    // Check if URL has changed
    const currentUrl = page.url();
    console.log(`   Current URL: ${currentUrl}`);

    if (currentUrl.includes(WEB_CONFIG.LOGIN_PATH)) {
      console.log('   Still on login page, login may have failed');
    } else {
      console.log('   Left login page');
    }

    // Check localStorage
    const authInfo = await page.evaluate(() => {
      const read = (key: string) =>
        localStorage.getItem(key) || sessionStorage.getItem(key) ? 'exists' : 'missing';

      return {
        accessToken: read('access_token'),
        refreshToken: read('refresh_token'),
        rememberToken: read('remember_token'),
        userInfo:
          read('auth') === 'exists' || read('authentication') === 'exists' ? 'exists' : 'missing',
        allKeys: {
          local: Object.keys(localStorage),
          session: Object.keys(sessionStorage),
        },
      };
    });

    console.log('   localStorage status:');
    console.log(`     - access_token: ${authInfo.accessToken}`);
    console.log(`     - refresh_token: ${authInfo.refreshToken}`);
    console.log(`     - remember_token: ${authInfo.rememberToken}`);
    console.log(`     - userInfo(auth): ${authInfo.userInfo}`);
    console.log(`     - localStorage keys: ${authInfo.allKeys.local.join(', ')}`);
    console.log(`     - sessionStorage keys: ${authInfo.allKeys.session.join(', ')}`);

    await page.screenshot({ path: '/tmp/10-final-state.png' });

    console.log('\n' + '='.repeat(80));
    console.log('Login debug test finished');
    console.log('='.repeat(80) + '\n');

    // Assert: login should succeed
    expect(currentUrl).not.toContain(WEB_CONFIG.LOGIN_PATH);
    expect(authInfo.accessToken).toBe('exists');
  });

  test('[DEBUG] API health check', async ({ page }) => {
    console.log('\nTesting API health check\n');

    const healthUrl = `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}${API_CONFIG.HEALTH_ENDPOINT}`;
    console.log(`   Health check URL: ${healthUrl}`);

    await page.goto(healthUrl);
    const content = await page.textContent('body');

    console.log(`   Response content: ${content}`);

    expect(content).toContain('ok');
    console.log('   API health check passed');
  });
});
