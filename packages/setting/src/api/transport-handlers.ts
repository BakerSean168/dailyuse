import { ok, fail } from '@dailyuse/contracts/result';
import type { SettingUseCases } from '../controllers/setting.controller';
import type { SettingApplicationPort } from '../infrastructure-server';

/**
 * Setting transport mapper.
 * setting 传输层映射器，只负责把 application port 适配到 controller 端口。
 */
export function createSettingTransportHandlers(api: SettingApplicationPort): SettingUseCases {
  return {
    getUserSetting: async (ctx) => ok(await api.getUserSetting(ctx.identityId)),
    patchUserSetting: async (data, ctx) =>
      ok(await api.patchUserSetting(ctx.identityId, data.category as any, data.patch)),
    resetUserSetting: async (ctx, category) =>
      ok(await api.resetUserSetting(ctx.identityId, category)),
    exportSettings: async (ctx) => ok(await api.exportSettings(ctx.identityId)),
    importSettings: async (data, ctx) => {
      let importData: Record<string, any>;
      try {
        importData = JSON.parse(data.data) as Record<string, any>;
      } catch {
        return fail({ code: 'VALIDATION_ERROR' as const, message: 'Invalid JSON in data field' });
      }

      return ok(
        await api.importSettings(ctx.identityId, importData, {
          merge: !data.overwrite,
        }),
      );
    },
    getDefaultSettings: () => ok(api.getDefaultSettings()),
  };
}
