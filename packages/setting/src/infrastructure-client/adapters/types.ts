/**
 * Setting Infrastructure Client - Port Interfaces
 *
 * Transport-agnostic interfaces for Setting API operations.
 */

import type { Result } from '@dailyuse/contracts/result';
import type { IResultHttpClient } from '@dailyuse/http-client';
import type { UserSettingClientDTO, PreferenceCategory } from '@dailyuse/contracts/setting';

export type { IResultHttpClient };

/**
 * IPC Client interface (Result-returning).
 * Canonical definition in @dailyuse/ipc-client (ResultIpcClient).
 */
export type { IResultIpcClient } from '@dailyuse/ipc-client';

/**
 * Setting API Client Interface — Aligned with PATCH /:category API
 */
export interface ISettingApiClient {
  getUserSettings(): Promise<Result<UserSettingClientDTO>>;
  patchCategory(
    category: PreferenceCategory,
    patch: Record<string, unknown>,
  ): Promise<Result<UserSettingClientDTO>>;
  resetUserSettings(category?: string): Promise<Result<UserSettingClientDTO>>;
  exportSettings(): Promise<Result<string>>;
  importSettings(
    data: string,
    options?: { merge?: boolean },
  ): Promise<Result<UserSettingClientDTO>>;
}
