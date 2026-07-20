import { test, expect, type Page } from '@playwright/test';
import { ensureLoginScene, ensureRegisterScene } from '../helpers/testHelpers';
import { completeEmailVerification } from '../helpers/auth-email-code';
import { WEB_CONFIG, TIMEOUT_CONFIG } from '../config';

const generateTestEmail = () =>
  `e2e-login-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.com`;
const testPassword = 'Test123456!';

test.describe('Authentication - 登录页基础验证', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthPage(page);
  });

  test('[P0] 正确凭证可以成功登录', async ({ page }) => {
    const testEmail = generateTestEmail();

    await registerUser(page, testEmail, testPassword);
    await expectAuthenticated(page);

    await logoutFromAccountCenter(page);
    await expectOnAuthPage(page);

    await fillLoginForm(page, testEmail, testPassword);
    await submitLoginForm(page);

    await expectAuthenticated(page);

    const authState = await readAuthState(page);
    expect(authState.accessToken).toBe(true);
    expect(authState.refreshToken).toBe(true);
  });

  test('[P0] 错误凭证会显示错误提示', async ({ page }) => {
    const testEmail = generateTestEmail();

    await registerUser(page, testEmail, testPassword);
    await expectAuthenticated(page);

    await logoutFromAccountCenter(page);
    await expectOnAuthPage(page);

    await fillLoginForm(page, testEmail, 'WrongPass123!');
    await submitLoginForm(page);

    await expect(page.getByText(/incorrect email or password|邮箱或密码错误/i).first()).toBeVisible(
      {
        timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
      },
    );
    await expect.poll(async () => page.url()).toContain(WEB_CONFIG.LOGIN_PATH);
  });

  test('[P1] 可以在登录和注册表单间切换', async ({ page }) => {
    await ensureRegisterScene(page);
    await expect(page.locator('#reg-email')).toBeVisible({
      timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
    });

    await ensureLoginScene(page);
    await expect(page.locator('#email')).toBeVisible({
      timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
    });
  });
});

async function gotoAuthPage(page: Page): Promise<void> {
  await page.goto(WEB_CONFIG.getFullUrl(WEB_CONFIG.LOGIN_PATH), {
    waitUntil: 'domcontentloaded',
    timeout: TIMEOUT_CONFIG.NAVIGATION,
  });

  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  await page.reload({ waitUntil: 'domcontentloaded', timeout: TIMEOUT_CONFIG.NAVIGATION });
  await ensureLoginScene(page);
}

async function openLoginTab(page: Page): Promise<void> {
  await ensureLoginScene(page);
  await expect(page.locator('#email')).toBeVisible({
    timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
  });
}

async function fillLoginForm(page: Page, email: string, password: string): Promise<void> {
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
}

async function submitLoginForm(page: Page): Promise<void> {
  await page.getByTestId('login-submit-button').click();
}

async function registerUser(page: Page, email: string, password: string): Promise<void> {
  await ensureRegisterScene(page);
  await expect(page.locator('#reg-email')).toBeVisible({
    timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
  });
  await page.locator('#reg-email').fill(email);
  await page.locator('#reg-password').fill(password);
  await page.locator('#confirm-password').fill(password);
  await page.getByTestId('register-submit-button').click();
  await completeEmailVerification(page, email);
}

async function expectAuthenticated(page: Page): Promise<void> {
  await page.waitForURL((url) => !url.pathname.includes(WEB_CONFIG.LOGIN_PATH), {
    timeout: TIMEOUT_CONFIG.LOGIN,
  });
  await page.waitForLoadState('domcontentloaded');
}

async function readAuthState(page: Page): Promise<{ accessToken: boolean; refreshToken: boolean }> {
  return page.evaluate(() => {
    const rawState =
      localStorage.getItem('authentication') ?? sessionStorage.getItem('authentication') ?? '';

    return {
      accessToken: rawState.includes('accessToken') || !!localStorage.getItem('access_token'),
      refreshToken: rawState.includes('refreshToken') || !!localStorage.getItem('refresh_token'),
    };
  });
}

async function logoutFromAccountCenter(page: Page): Promise<void> {
  await page.goto(WEB_CONFIG.getFullUrl('/account/center'), {
    waitUntil: 'domcontentloaded',
    timeout: TIMEOUT_CONFIG.NAVIGATION,
  });

  await expect(page.getByTestId('account-center-view')).toBeVisible({
    timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
  });
  await page.getByTestId('account-logout-button').click();
  const confirmDialog = page.getByRole('alertdialog', {
    name: /log out of your account|确认退出登录/i,
  });
  await expect(confirmDialog).toBeVisible({
    timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
  });
  await confirmDialog.getByRole('button', { name: /log out|退出登录/i }).click();
}

async function expectOnAuthPage(page: Page): Promise<void> {
  await page.waitForURL((url) => url.pathname.includes(WEB_CONFIG.LOGIN_PATH), {
    timeout: TIMEOUT_CONFIG.LOGIN,
  });
  await openLoginTab(page);
}
