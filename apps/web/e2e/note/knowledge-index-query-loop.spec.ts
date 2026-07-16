import { expect, test, type APIResponse } from '@playwright/test';
import { API_CONFIG, TIMEOUT_CONFIG } from '../config';
import { registerAndLogin } from '../helpers/testHelpers';

const testPassword = 'Test123456!';

test.describe('Knowledge index and query closed loop', () => {
  test('[P0] indexes newly saved note content and returns it as a grounded citation', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const title = `Cobalt Orchard ${suffix}`;
    const fileName = `${title}.md`;
    const knowledgeStatement =
      'The cobalt orchard protocol uses seven lanterns to verify traceable evidence.';

    await registerAndLogin(page, {
      email: `e2e-knowledge-loop-${suffix}@test.com`,
      password: testPassword,
      landingPath: '/repository',
    });

    const token = await page.evaluate(() => localStorage.getItem('access_token'));
    expect(token, 'Registration should persist an access token').toBeTruthy();
    const headers = { Authorization: `Bearer ${token}` };
    const provider = await expectApiData<{ id: string }>(
      await page.request.post(`${API_CONFIG.FULL_URL}/ai/providers`, {
        headers,
        data: {
          name: `E2E knowledge provider ${suffix}`,
          baseUrl: 'http://127.0.0.1:58102/v1',
          apiKey: 'e2e-provider-key',
          model: 'e2e-knowledge-model',
          isDefault: true,
        },
      }),
    );

    await expect(page.getByTestId('repository-workspace-view')).toBeVisible({
      timeout: TIMEOUT_CONFIG.ELEMENT_WAIT,
    });
    await page.locator('[data-primary-action="create-note"]:visible').click();
    await page.getByTestId('repository-create-note-title').fill(title);
    await page.getByTestId('repository-create-note-confirm').click();

    const editor = page.locator('.cm-content');
    await expect(editor).toBeFocused({ timeout: TIMEOUT_CONFIG.ELEMENT_WAIT });
    await editor.fill(`# ${title}\n\n${knowledgeStatement}`);
    await expect(page.getByTestId('editor-document-unsaved')).toBeVisible();
    await expect(page.getByTestId('editor-document-saved')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('knowledge-index-ready')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('knowledge-index-failed')).toHaveCount(0);

    const repository = await expectApiData<{ id: string }>(
      await page.request.get(`${API_CONFIG.FULL_URL}/repositories/current`, { headers }),
    );
    const resources = await expectApiData<Array<{ id: string; name: string }>>(
      await page.request.get(`${API_CONFIG.FULL_URL}/repositories/${repository.id}/resources`, {
        headers,
      }),
    );
    const note = resources.find((resource) => resource.name === fileName);
    expect(note, `Expected repository resource ${fileName}`).toBeDefined();

    const reindex = await expectApiData<{
      indexedCount: number;
      failedCount: number;
      results: Array<{ resourceId: string; status: 'indexed' | 'reused' | 'failed' }>;
    }>(
      await page.request.post(`${API_CONFIG.FULL_URL}/ai/knowledge/reindex`, {
        headers,
        data: { resourceIds: [note!.id], force: true },
      }),
    );
    expect(reindex.failedCount).toBe(0);
    expect(reindex.indexedCount).toBe(1);
    expect(reindex.results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ resourceId: note!.id, status: 'indexed' }),
      ]),
    );

    const answer = await expectApiData<{
      answer: string;
      citations: Array<{ resourceId: string; resourcePath: string; excerpt: string }>;
      matchedResourceCount: number;
    }>(
      await page.request.post(`${API_CONFIG.FULL_URL}/ai/knowledge/query`, {
        headers,
        data: {
          query: 'How many lanterns does the cobalt orchard protocol use?',
          providerId: provider.id,
          maxResources: 8,
        },
      }),
    );

    expect(answer.matchedResourceCount).toBeGreaterThanOrEqual(1);
    expect(answer.answer).toContain('cobalt orchard protocol uses seven lanterns');
    expect(answer.citations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          resourceId: note!.id,
          resourcePath: expect.stringContaining(fileName),
          excerpt: expect.stringContaining(knowledgeStatement),
        }),
      ]),
    );
  });
});

async function expectApiData<T>(response: APIResponse): Promise<T> {
  const body = (await response.json()) as {
    ok?: boolean;
    data?: T;
    error?: unknown;
  };

  expect(response.ok(), JSON.stringify(body.error ?? body)).toBe(true);
  expect(body.ok, JSON.stringify(body)).not.toBe(false);
  expect(body.data, JSON.stringify(body)).toBeDefined();
  return body.data as T;
}
