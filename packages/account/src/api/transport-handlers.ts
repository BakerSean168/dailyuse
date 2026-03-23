import { ok, fail } from '@dailyuse/contracts/result';
import type { AccountUseCases } from '../controllers/account.controller';
import type { AccountApplicationPort } from '../infrastructure-server';

/**
 * Thin transport mapper from account application port to controller port.
 *
 * Each handler converts the transport-neutral `api` return value into the
 * `Result<T>` shape expected by `AccountController`.  No business logic lives
 * here — only result wrapping and null→fail mapping.
 */
export function createAccountTransportHandlers(api: AccountApplicationPort): AccountUseCases {
  return {
    getProfile: async (ctx) => {
      const profile = await api.getProfile(ctx.identityId);
      if (!profile) {
        return fail({ code: 'ACCOUNT_NOT_FOUND', message: 'Account profile not found' });
      }
      return ok(profile);
    },

    updateProfile: async (data, ctx) => {
      const result = await api.updateProfile(ctx.identityId, data);
      return ok(result.account);
    },

    updateSettings: async (data, ctx) => {
      const result = await api.updateSettings(ctx.identityId, data);
      return ok(result);
    },

    checkAvailability: async (data) => {
      return ok(await api.checkAvailability(data));
    },

    closeAccount: async (data, ctx) => {
      await api.closeAccount(ctx.identityId, data);
      return ok(undefined as void);
    },
  };
}
