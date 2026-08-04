import { expect, test, type Page } from '@playwright/test';
import { ensureLoginScene } from '../helpers/testHelpers';
import { TIMEOUT_CONFIG, WEB_CONFIG } from '../config';

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

test.describe('Authentication - GitHub OAuth provider entry', () => {
  test('[P0] GitHub button issues the configured provider authorize URL', async ({ page }) => {
    await gotoCleanAuthPage(page);

    const githubButton = page.getByTestId('login-github-button');
    await expect(githubButton).toBeVisible({ timeout: TIMEOUT_CONFIG.ELEMENT_WAIT });
    await page.route('https://github.com/**', (route) =>
      route.fulfill({ status: 200, contentType: 'text/html', body: '<main>GitHub OAuth gate</main>' }),
    );

    await Promise.all([
      page.waitForURL((url) => url.hostname === 'github.com', { timeout: TIMEOUT_CONFIG.LOGIN }),
      githubButton.click(),
    ]);

    const authorizeUrl = new URL(page.url());
    expect(authorizeUrl.pathname).toBe('/login/oauth/authorize');
    expect(authorizeUrl.searchParams.get('client_id')).toBe('e2e-mock');
    expect(authorizeUrl.searchParams.get('state')).toBeTruthy();
  });
});
