import fs from 'node:fs';
import { test as base, expect, type Page } from '@playwright/test';
import { DesktopAppController } from '../helpers/desktop';
import {
  ensureE2EAccount,
  loadSyncCredentials,
  type SyncCredentials,
} from '../helpers/credentials';
import { deleteGoalIfPresent, openGoalList } from '../helpers/goal';

type CleanupTracker = (goalName: string) => string;

type SyncFixtures = {
  credentials: SyncCredentials;
  desktop: DesktopAppController;
  webPage: Page;
  trackGoal: CleanupTracker;
};

async function submitWebLogin(page: Page, credentials: SyncCredentials): Promise<void> {
  await page.goto('/auth', { waitUntil: 'domcontentloaded' });

  const loginTab = page.getByTestId('login-tab');
  if ((await loginTab.count()) > 0) {
    await loginTab.click();
  }

  await page.getByTestId('login-username-input').locator('input').fill(credentials.email);
  await page.getByTestId('login-password-input').locator('input').fill(credentials.password);
  await page.getByTestId('login-submit-button').click();

  await page.waitForURL((url) => !url.pathname.startsWith('/auth'), { timeout: 30_000 });
}

export const test = base.extend<SyncFixtures>({
  credentials: [
    async ({}, use) => {
      await use(loadSyncCredentials());
    },
    { scope: 'worker' },
  ],

  desktop: async ({ credentials, request }, use, testInfo) => {
    await ensureE2EAccount(request, credentials);

    const userDataDir = testInfo.outputPath('desktop-user-data');
    const desktop = new DesktopAppController(userDataDir, credentials.apiBaseUrl);

    await desktop.launch();
    await desktop.ensureAuthenticated(credentials);
    await use(desktop);
    await desktop.close();
    if (testInfo.status === testInfo.expectedStatus) {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } else {
      console.log(`[sync-fixture] Preserving failed Desktop profile at ${userDataDir}`);
    }
  },

  webPage: async ({ page, credentials, request }, use) => {
    await ensureE2EAccount(request, credentials);
    await submitWebLogin(page, credentials);
    await openGoalList(page, 'web');
    await use(page);
  },

  trackGoal: async ({ desktop, webPage }, use) => {
    const goalNames = new Set<string>();

    await use((goalName: string) => {
      goalNames.add(goalName);
      return goalName;
    });

    for (const goalName of Array.from(goalNames).reverse()) {
      try {
        await deleteGoalIfPresent(webPage, 'web', goalName);
      } catch {
        // Ignore cleanup failures on the web client and let desktop try as a fallback.
      }

      try {
        await deleteGoalIfPresent(desktop.page, 'desktop', goalName);
      } catch {
        // Ignore fallback cleanup failures so teardown still completes.
      }
    }
  },
});

export { expect };
