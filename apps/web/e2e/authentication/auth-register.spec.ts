import { expect, test, type Page } from '@playwright/test';
import { ensureLoginScene, ensureRegisterScene } from '../helpers/testHelpers';
import { waitForCapturedEmailLink } from '../helpers/auth-email-link';
import { TIMEOUT_CONFIG, WEB_CONFIG } from '../config';

const testPassword = 'Test123456!';

function generateTestEmail(): string {
  return `e2e-verify-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.com`;
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

test.describe('Authentication - email verification', () => {
  test('[P0] register → open verification link → verified cloud session', async ({ page }) => {
    const email = generateTestEmail();
    await gotoCleanAuthPage(page);

    await ensureRegisterScene(page);
    await page.locator('#reg-email').fill(email);
    await page.locator('#reg-password').fill(testPassword);
    await page.locator('#confirm-password').fill(testPassword);
    await page.getByTestId('register-submit-button').click();

    // Policy B: session may be issued while still Unverified; UI should open verify scene.
    await expect(page.getByTestId('verify-email-form')).toBeVisible({
      timeout: TIMEOUT_CONFIG.LOGIN,
    });

    const link = await waitForCapturedEmailLink(email, 'email-verification');
    await page.goto(link, { waitUntil: 'domcontentloaded', timeout: TIMEOUT_CONFIG.NAVIGATION });

    await ensureLoginScene(page);
    await page.locator('#email').fill(email);
    await page.locator('#password').fill(testPassword);
    await page.getByTestId('login-submit-button').click();
    await page.waitForURL((url) => !url.pathname.includes(WEB_CONFIG.LOGIN_PATH), {
      timeout: TIMEOUT_CONFIG.LOGIN,
    });

    const session = await page.request.get('/api/auth/get-session');
    expect(session.ok()).toBe(true);
    expect((await session.json()).user.emailVerified).toBe(true);
  });
});
