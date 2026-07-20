import { describe, expect, it, vi } from 'vitest';
import type { Context } from '@dailyuse/contracts/shared';
import { ServerHeldDataDisclosureController } from './data-portability.controller';

const context = { identityId: 'identity-1' } as Context;

describe('ServerHeldDataDisclosureController', () => {
  it('uses the authenticated identity and accepts only the empty request', async () => {
    const api = {
      exportServerHeldDataDisclosure: vi.fn().mockResolvedValue({
        fileName: 'disclosure.json',
        content: '{}',
        summary: { entityCounts: {}, cachedAttachmentBytes: 0, notes: [] },
      }),
    };
    const controller = new ServerHeldDataDisclosureController(api);

    await expect(controller.exportServerHeldDataDisclosure({}, context)).resolves.toMatchObject({
      ok: true,
      data: { fileName: 'disclosure.json' },
    });
    expect(api.exportServerHeldDataDisclosure).toHaveBeenCalledWith('identity-1', {});

    await expect(
      controller.exportServerHeldDataDisclosure({ includeCredentials: true }, context),
    ).resolves.toMatchObject({
      ok: false,
      error: { code: 'VALIDATION_ERROR' },
    });
  });
});
