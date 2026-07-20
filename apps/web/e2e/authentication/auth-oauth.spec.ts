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

test.describe('Authentication - GitHub OAuth (mock provider)', () => {
  test('[P0] GitHub button issues authorize URL and mock callback establishes session', async ({
    page,
  }) => {
    await gotoCleanAuthPage(page);

    const githubButton = page.getByTestId('login-github-button');
    // When mock provider is enabled in e2e lane, the button should be present.
    // e2e 车道启用 mock 提供者时按钮应可见。
    await expect(githubButton).toBeVisible({ timeout: TIMEOUT_CONFIG.ELEMENT_WAIT });

    await Promise.all([
      page.waitForURL((url) => url.searchParams.has('code') && url.searchParams.has('state'), {
        timeout: TIMEOUT_CONFIG.LOGIN,
      }),
      githubButton.click(),
    ]);

    // completeGithubOAuth runs on mount when code+state present.
    await page.waitForURL((url) => !url.pathname.includes(WEB_CONFIG.LOGIN_PATH), {
      timeout: TIMEOUT_CONFIG.LOGIN,
    });

    const identity = await page.evaluate(() => {
      try {
        const raw = localStorage.getItem('authentication');
        if (!raw) return null;
        const parsed = JSON.parse(raw) as {
          currentIdentity?: { hasOAuth?: boolean; status?: string };
        };
        return parsed.currentIdentity ?? null;
      } catch {
        return null;
      }
    });
    expect(identity?.hasOAuth).toBe(true);
  });
});
