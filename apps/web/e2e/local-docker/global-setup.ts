import { chromium, type FullConfig } from '@playwright/test';

export default async function localDockerBrowserProbe(config: FullConfig): Promise<void> {
  const webOrigin = process.env.E2E_WEB_BASE_URL;
  const token = process.env.E2E_LOCAL_DOCKER_PROBE_TOKEN;
  if (!webOrigin || !token) {
    throw new Error(
      'Local Docker browser proof requires E2E_WEB_BASE_URL and E2E_LOCAL_DOCKER_PROBE_TOKEN.',
    );
  }

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage(config.projects[0]?.use);
    const response = await page.goto(
      `${webOrigin}/?__pm_local_docker_probe=${encodeURIComponent(token)}`,
      { waitUntil: 'domcontentloaded' },
    );
    if (!response?.ok()) {
      throw new Error(
        `Local Docker browser probe failed with HTTP ${response?.status() ?? 'no response'}.`,
      );
    }
  } finally {
    await browser.close();
  }
}
