import { expect, test, type APIRequestContext } from '@playwright/test';
import { API_CONFIG } from '../config';
import { registerAndLogin } from '../helpers/testHelpers';

const testPassword = 'Test123456!';

test.describe('Legacy database note mutation boundary', () => {
  test('[P0] does not mount generic Repository/Resource or Editor mutation endpoints', async ({
    page,
  }) => {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await registerAndLogin(page, {
      email: `e2e-note-boundary-${suffix}@test.com`,
      password: testPassword,
      landingPath: '/repository',
    });

    const token = await page.evaluate(() => localStorage.getItem('access_token'));
    expect(token).toBeTruthy();
    const request = page.request;
    const headers = { Authorization: `Bearer ${token}` };

    await expectNotMounted(
      request.post(`${API_CONFIG.FULL_URL}/repositories/legacy-repository/resources`, {
        headers,
        data: { name: 'legacy.md', type: 'File', content: '# legacy' },
      }),
    );
    await expectNotMounted(
      request.put(`${API_CONFIG.FULL_URL}/resources/legacy-resource`, {
        headers,
        data: { content: '# overwritten' },
      }),
    );
    await expectNotMounted(
      request.put(`${API_CONFIG.FULL_URL}/editor/content/legacy-resource`, {
        headers,
        data: { content: '# overwritten' },
      }),
    );
  });
});

async function expectNotMounted(
  responsePromise: ReturnType<APIRequestContext['put']>,
): Promise<void> {
  const response = await responsePromise;
  expect(response.status()).toBe(404);
}
