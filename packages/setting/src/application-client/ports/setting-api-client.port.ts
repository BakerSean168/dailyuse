/**
 * Setting API Client Port
 *
 * Transport-agnostic interface for Setting API operations.
 * Implementations: HTTP adapters (web), IPC adapters (desktop).
 */

import type { Result } from '@memoflow/contracts/result';
import type { UserSettingClientDTO, PreferenceCategory } from '@memoflow/contracts/setting';

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
