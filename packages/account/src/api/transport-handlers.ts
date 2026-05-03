import type { Result } from '@dailyuse/contracts/result';
import { ok, fail } from '@dailyuse/contracts/result';
import type { ExecutionContext } from '@dailyuse/contracts/shared';
import type { AccountClientDTO } from '@dailyuse/contracts/account';
import type { AccountUseCases } from '../controllers/account.controller';
import type { AccountApplicationPort } from '../infrastructure-server';

/**
 * Thin transport mapper from account application port to controller port.
 *
 * ExecutionContext flows through unmodified from the use cases.
 */
export function createAccountTransportHandlers(api: AccountApplicationPort): AccountUseCases {
  return {
    getProfile: async (cx): Promise<Result<AccountClientDTO>> => {
      const result = await api.getProfile(cx);
      if (!result.ok) return result;
      if (result.data === null) {
        return fail({ code: 'NOT_FOUND', message: 'Account not found' });
      }
      return ok(result.data);
    },
    updateProfile: (data, cx) => api.updateProfile(data, cx),
    updateSettings: (data, cx) => api.updateSettings(data, cx),
    checkAvailability: (data) => api.checkAvailability(data),
    closeAccount: (data, cx) => api.closeAccount(data, cx),
  };
}
