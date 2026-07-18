import { expect, test, type Page } from '@playwright/test';
import { ensureLoginScene, ensureRegisterScene, login } from '../helpers/testHelpers';
import { waitForCapturedEmailCode } from '../helpers/auth-email-code';
import { TIMEOUT_CONFIG, WEB_CONFIG } from '../config';

const oldPassword = 'Test123456!';
const newPassword = 'NewTest654321!';

function generateTestEmail(): string {
  return `e2e-reset-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.com`;
}

async function gotoCleanAuthPage(page: Page): Promise<void> {
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

async function registerUser(page: Page, email: string, password: string): Promise<void> {
  await ensureRegisterScene(page);
  await page.locator('#reg-email').fill(email);
  await page.locator('#reg-password').fill(password);
  await page.locator('#confirm-password').fill(password);
  await page.getByTestId('register-submit-button').click();
  // Accept either verify scene or authenticated shell depending on gate policy.
  await Promise.race([
    page
      .getByTestId('verify-email-form')
      .waitFor({ state: 'visible', timeout: TIMEOUT_CONFIG.LOGIN }),
    page.waitForURL((url) => !url.pathname.includes(WEB_CONFIG.LOGIN_PATH), {
      timeout: TIMEOUT_CONFIG.LOGIN,
    }),
  ]);
}

test.describe('Authentication - password recovery', () => {
  test('[P0] forgot → code → reset → old password fails → new password works → code replay fails', async ({
    page,
  }) => {
    const email = generateTestEmail();
    await gotoCleanAuthPage(page);
    await registerUser(page, email, oldPassword);

    await gotoCleanAuthPage(page);
    await page.getByTestId('login-forgot-link').click();
    await expect(page.getByTestId('forgot-form')).toBeVisible({
      timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
    });
    await page.locator('#forgot-email').fill(email);
    await page.getByTestId('forgot-submit-button').click();
    await expect(page.getByTestId('forgot-next-button')).toBeVisible({
      timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
    });
    await page.getByTestId('forgot-next-button').click();

    await expect(page.getByTestId('reset-form')).toBeVisible({
      timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
    });

    const code = await waitForCapturedEmailCode(email, 'password-reset');
    await page.locator('#reset-email').fill(email);
    await page.locator('#reset-code').fill(code);
    await page.locator('#reset-password').fill(newPassword);
    await page.locator('#reset-confirm-password').fill(newPassword);
    await page.getByTestId('reset-submit-button').click();

    await expect(page.getByTestId('login-form')).toBeVisible({
      timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
    });

    // Old password must fail.
    await page.locator('#email').fill(email);
    await page.locator('#password').fill(oldPassword);
    await page.getByTestId('login-submit-button').click();
    await expect(page.getByText(/incorrect email or password|邮箱或密码错误/i).first()).toBeVisible({
      timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
    });

    // New password succeeds.
    await login(page, email, newPassword);
    await page.waitForURL((url) => !url.pathname.includes(WEB_CONFIG.LOGIN_PATH), {
      timeout: TIMEOUT_CONFIG.LOGIN,
    });

    // Replay consumed code must fail (open reset scene via query).
    await page.goto(WEB_CONFIG.getFullUrl(`${WEB_CONFIG.LOGIN_PATH}?scene=reset`), {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUT_CONFIG.NAVIGATION,
    });
    await expect(page.getByTestId('reset-form')).toBeVisible({
      timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
    });
    await page.locator('#reset-email').fill(email);
    await page.locator('#reset-code').fill(code);
    await page.locator('#reset-password').fill(`${newPassword}X`);
    await page.locator('#reset-confirm-password').fill(`${newPassword}X`);
    await page.getByTestId('reset-submit-button').click();
    await expect(page.getByTestId('auth-error-banner')).toBeVisible({
      timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
    });
  });
});
