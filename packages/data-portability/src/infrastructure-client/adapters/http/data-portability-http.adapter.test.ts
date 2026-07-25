import { describe, expect, it, vi } from 'vitest';
import { DataPortabilityHttpAdapter } from './data-portability-http.adapter';

describe('DataPortabilityHttpAdapter', () => {
  it('posts server-held disclosure to its dedicated non-import route', async () => {
    const httpClient = {
      post: vi.fn().mockResolvedValue({
        ok: true,
        data: {
          fileName: 'disclosure.json',
          content: '{}',
          summary: { entityCounts: {}, cachedAttachmentBytes: 0, notes: [] },
        },
      }),
    };
    const adapter = new DataPortabilityHttpAdapter(httpClient);

    const result = await adapter.exportServerHeldDataDisclosure({});

    expect(httpClient.post).toHaveBeenCalledWith(
      '/data-portability/server-held-data-disclosure',
      {},
    );
    expect(result.ok).toBe(true);
  });
});
