/**
 * UserSetting Memory Repository
 *
 * In-memory implementation of IUserSettingRepository for testing.
 */

import type { IUserSettingRepository } from '../../domain-server';
import type { UserSetting } from '@/domain-server/aggregates/user-setting';

/**
 * UserSetting Memory Repository
 *
 * In-memory implementation for testing purposes.
 */
export class UserSettingMemoryRepository implements IUserSettingRepository {
  private settings = new Map<string, UserSetting>(); // keyed by identityId

  async findByIdentityId(identityId: string): Promise<UserSetting | null> {
    return this.settings.get(identityId) ?? null;
  }

  async save(setting: UserSetting): Promise<void> {
    this.settings.set((setting as any).identityId, setting);
  }

  async delete(identityId: string): Promise<void> {
    this.settings.delete(identityId);
  }

  // Test helpers
  clear(): void {
    this.settings.clear();
  }

  seed(settings: UserSetting[]): void {
    settings.forEach((s: any) => this.settings.set(s.identityId, s));
  }
}
