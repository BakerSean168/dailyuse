import type {
  ExportSettings,
  GetDefaultSettings,
  GetUserSetting,
  ImportSettings,
  PatchUserSetting,
  ResetUserSetting,
} from './use-cases';

/**
 * Setting transport-neutral application port.
 */
export interface SettingApplicationPort {
  getUserSetting(identityId: string): Promise<Awaited<ReturnType<GetUserSetting['execute']>>>;
  patchUserSetting(
    identityId: string,
    category: Parameters<PatchUserSetting['execute']>[1],
    patch: Parameters<PatchUserSetting['execute']>[2],
  ): Promise<Awaited<ReturnType<PatchUserSetting['execute']>>>;
  resetUserSetting(
    identityId: string,
    category?: Parameters<ResetUserSetting['execute']>[1],
  ): Promise<Awaited<ReturnType<ResetUserSetting['execute']>>>;
  exportSettings(identityId: string): Promise<Awaited<ReturnType<ExportSettings['execute']>>>;
  importSettings(
    identityId: string,
    data: Parameters<ImportSettings['execute']>[1],
    options?: Parameters<ImportSettings['execute']>[2],
  ): Promise<Awaited<ReturnType<ImportSettings['execute']>>>;
  getDefaultSettings(): ReturnType<GetDefaultSettings['execute']>;
}
