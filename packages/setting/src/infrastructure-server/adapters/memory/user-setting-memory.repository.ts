/**
 * UserSetting Memory Repository
 *
 * In-memory implementation of IUserSettingRepository for testing.
 */

import type { IUserSettingRepository } from '../../ports/user-setting-repository.port';
import type { UserSetting } from '@/domain-server/aggregates/user-setting';

/**
 * UserSetting Memory Repository
 *
 * In-memory implementation for testing purposes.
 */
export class UserSettingMemoryRepository implements IUserSettingRepository {
  private settings = new Map<string, UserSetting>(); // keyed by accountUuid

  async findByAccountUuid(accountUuid: string): Promise<UserSetting | null> {
    return this.settings.get(accountUuid) ?? null;
  }

  async save(setting: UserSetting): Promise<void> {
    this.settings.set((setting as any).accountUuid, setting);
  }

  async delete(accountUuid: string): Promise<void> {
    this.settings.delete(accountUuid);
  }

  // Test helpers
  clear(): void {
    this.settings.clear();
  }

  seed(settings: UserSetting[]): void {
    settings.forEach((s: any) => this.settings.set(s.accountUuid, s));
  }
}
