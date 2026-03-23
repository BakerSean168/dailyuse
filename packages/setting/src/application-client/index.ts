/**
 * Setting Application Client Layer
 *
 * Provides the client-side facade over any transport adapter (HTTP / IPC).
 * Consumers should depend on `ISettingApiClient` (the port) and inject a
 * concrete adapter from `infrastructure-client`.
 */

import type { Result } from '@dailyuse/contracts/result';
import type { UserSettingClientDTO, PreferenceCategory } from '@dailyuse/contracts/setting';
import type { ISettingApiClient } from '../infrastructure-client/adapters/types';

// Re-export the port so consumers can import from the application layer.
export type { ISettingApiClient } from '../infrastructure-client/adapters/types';

// ─── Client Application Port ────────────────────────────────────────────────

/**
 * High-level client-side operations for the setting module.
 *
 * Unlike the server-side `SettingApplicationPort`, this port returns
 * `Result<T>` directly so the UI layer can decide how to handle errors.
 */
export interface SettingClientPort {
  getUserSettings(): Promise<Result<UserSettingClientDTO>>;
  patchCategory(
    category: PreferenceCategory,
    patch: Record<string, unknown>,
  ): Promise<Result<UserSettingClientDTO>>;
  resetUserSettings(category?: string): Promise<Result<UserSettingClientDTO>>;
  exportSettings(): Promise<Result<string>>;
  importSettings(data: string): Promise<Result<UserSettingClientDTO>>;
}

// ─── Client Service ──────────────────────────────────────────────────────────

/**
 * Setting Client Service — thin facade that delegates to an `ISettingApiClient`.
 *
 * Returns `Result<T>` (no throwing) so the caller keeps full control.
 */
export class SettingClientService implements SettingClientPort {
  constructor(private readonly apiClient: ISettingApiClient) {
    this.getUserSettings = this.getUserSettings.bind(this);
    this.patchCategory = this.patchCategory.bind(this);
    this.resetUserSettings = this.resetUserSettings.bind(this);
    this.exportSettings = this.exportSettings.bind(this);
    this.importSettings = this.importSettings.bind(this);
  }

  getUserSettings(): Promise<Result<UserSettingClientDTO>> {
    return this.apiClient.getUserSettings();
  }

  patchCategory(
    category: PreferenceCategory,
    patch: Record<string, unknown>,
  ): Promise<Result<UserSettingClientDTO>> {
    return this.apiClient.patchCategory(category, patch);
  }

  resetUserSettings(category?: string): Promise<Result<UserSettingClientDTO>> {
    return this.apiClient.resetUserSettings(category);
  }

  exportSettings(): Promise<Result<string>> {
    return this.apiClient.exportSettings();
  }

  importSettings(data: string): Promise<Result<UserSettingClientDTO>> {
    return this.apiClient.importSettings(data);
  }
}

// ─── Factory ─────────────────────────────────────────────────────────────────

/**
 * Create a `SettingClientService` from any transport adapter.
 *
 * ```ts
 * const client = createSettingClientService(new SettingHttpAdapter(httpClient));
 * ```
 */
export function createSettingClientService(apiClient: ISettingApiClient): SettingClientService {
  return new SettingClientService(apiClient);
}
