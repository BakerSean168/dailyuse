import fs from 'node:fs';
import { test as base } from '@playwright/test';
import { DesktopAppController } from '../../sync/helpers/desktop';
import {
  ensureE2EAccount,
  loadSyncCredentials,
  type SyncCredentials,
} from '../../sync/helpers/credentials';

type DesktopScreenshotFixtures = {
  credentials: SyncCredentials;
  desktop: DesktopAppController;
};

export const test = base.extend<DesktopScreenshotFixtures>({
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
    fs.rmSync(userDataDir, { recursive: true, force: true });
  },
});
