/**
 * Residual 1339: real GitHub OAuth provider path (NOT e2e-mock).
 *
 * Prerequisites:
 * - GITHUB_OAUTH_CLIENT_ID + GITHUB_OAUTH_CLIENT_SECRET in gitignored
 *   `.env.development.local` or `.env.test.local` (not e2e-mock)
 * - OAuth App callback URL covers the Playwright web origin (default
 *   http://127.0.0.1:5173/auth)
 * - Run headed so a human can complete GitHub consent if needed:
 *   pnpm nx run web:e2e:oauth-real
 *
 * Explicitly does NOT close §13.2 via mock Authentication - GitHub OAuth (mock provider).
 */
import { expect, test, type Page } from '@playwright/test';
import { ensureLoginScene } from '../helpers/testHelpers';
import { TIMEOUT_CONFIG, WEB_CONFIG } from '../config';
import { API_CONFIG } from '../config';
import { hasRealGithubOAuthCredentials } from '../../playwright.server';

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

test.describe('Authentication - GitHub OAuth (real provider)', () => {
  test.beforeAll(() => {
    test.skip(
      !hasRealGithubOAuthCredentials(),
      'Real OAuth requires GITHUB_OAUTH_CLIENT_ID + GITHUB_OAUTH_CLIENT_SECRET (not e2e-mock) in gitignored local env',
    );
  });

  test('[P0] GitHub button opens github.com authorize; after consent Better Auth has a session', async ({
    page,
  }) => {
    await gotoCleanAuthPage(page);

    const githubButton = page.getByTestId('login-github-button');
    await expect(githubButton).toBeVisible({ timeout: TIMEOUT_CONFIG.ELEMENT_WAIT });

    await Promise.all([
      page.waitForURL(
        (url) =>
          url.hostname === 'github.com' &&
          (url.pathname.includes('/login/oauth/authorize') || url.pathname.includes('/login')),
        { timeout: TIMEOUT_CONFIG.LOGIN },
      ),
      githubButton.click(),
    ]);

    // Prove we left the product origin for real GitHub (not e2e-mock local callback).
    expect(page.url()).toMatch(/github\.com/);
    expect(page.url()).not.toContain('e2e-github-');

    // Semi-manual: human signs in + authorizes in the headed Chromium window.
    // Allow up to 10 minutes for interactive GitHub login/2FA/consent.
    console.log(
      '[oauth-real] Waiting up to 10m for human GitHub sign-in + authorize. ' +
        'Complete login in the Playwright Chromium window (app: memoflow-local-oauth).',
    );
    await page.waitForURL(
      (url) =>
        url.hostname !== 'github.com' &&
        (url.searchParams.has('code') || !url.pathname.includes(WEB_CONFIG.LOGIN_PATH)),
      { timeout: 10 * 60 * 1000 },
    );

    await page.waitForURL((url) => !url.pathname.includes(WEB_CONFIG.LOGIN_PATH), {
      timeout: TIMEOUT_CONFIG.LOGIN,
    });

    const sessionResponse = await page.request.get(`${API_CONFIG.AUTH_URL}/get-session`);
    expect(sessionResponse.ok()).toBe(true);
    const session = await sessionResponse.json() as {
      user?: { id?: string; email?: string };
      session?: { id?: string };
    };
    expect(session.user?.id).toBeTruthy();
    expect(session.user?.email).toBeTruthy();
    expect(session.session?.id).toBeTruthy();

    const persistedBearer = await page.evaluate(() =>
      Object.entries(localStorage).some(([key, value]) =>
        /token|session/i.test(key) || /bearer\s+/i.test(value),
      ),
    );
    expect(persistedBearer).toBe(false);
  });
});
