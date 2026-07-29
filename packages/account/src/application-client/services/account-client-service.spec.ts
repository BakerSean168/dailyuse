import { describe, expect, it, vi } from 'vitest';
import { ok } from '@memoflow/contracts/result';
import type { IAccountApiClient } from '../ports/account-api-client.port';
import { AccountClientService } from './account-client-service';

describe('AccountClientService', () => {
  it('returns NOT_FOUND instead of throwing when a transport violates the contract with ok(null)', async () => {
    const apiClient = {
      getMyProfile: vi.fn().mockResolvedValue(ok(null)),
    } as unknown as IAccountApiClient;
    const service = new AccountClientService(apiClient);

    await expect(service.getMyProfile()).resolves.toMatchObject({
      ok: false,
      error: { code: 'NOT_FOUND' },
    });
  });
});
