/**
 * Setting Memory Repository
 *
 * In-memory implementation of ISettingRepository for testing.
 */

import type { ISettingRepository } from '../../ports/setting-repository.port';
import type { Setting } from '@/domain-server';
import type { SettingScope } from '@dailyuse/contracts/setting';

/**
 * Setting Memory Repository
 *
 * In-memory implementation for testing purposes.
 */
export class SettingMemoryRepository implements ISettingRepository {
  private settings = new Map<string, Setting>();

  async save(setting: Setting): Promise<void> {
    this.settings.set((setting as any).uuid, setting);
  }

  async findById(uuid: string, _options?: { includeHistory?: boolean }): Promise<Setting | null> {
    return this.settings.get(uuid) ?? null;
  }

  async findByKey(key: string, scope: SettingScope, contextUuid?: string): Promise<Setting | null> {
    return (
      Array.from(this.settings.values()).find(
        (s: any) => s.key === key && s.scope === scope && s.contextUuid === contextUuid,
      ) ?? null
    );
  }

  async findByScope(
    scope: SettingScope,
    contextUuid?: string,
    _options?: { includeHistory?: boolean },
  ): Promise<Setting[]> {
    return Array.from(this.settings.values()).filter(
      (s: any) => s.scope === scope && (!contextUuid || s.contextUuid === contextUuid),
    );
  }

  async findByGroup(groupUuid: string, _options?: { includeHistory?: boolean }): Promise<Setting[]> {
    return Array.from(this.settings.values()).filter((s: any) => s.groupUuid === groupUuid);
  }

  async findSystemSettings(_options?: { includeHistory?: boolean }): Promise<Setting[]> {
    return Array.from(this.settings.values()).filter((s: any) => s.scope === 'SYSTEM');
  }

  async findUserSettings(accountUuid: string, _options?: { includeHistory?: boolean }): Promise<Setting[]> {
    return Array.from(this.settings.values()).filter(
      (s: any) => s.scope === 'USER' && s.contextUuid === accountUuid,
    );
  }

  async findDeviceSettings(deviceId: string, _options?: { includeHistory?: boolean }): Promise<Setting[]> {
    return Array.from(this.settings.values()).filter(
      (s: any) => s.scope === 'DEVICE' && s.contextUuid === deviceId,
    );
  }

  async delete(uuid: string): Promise<void> {
    const setting = this.settings.get(uuid) as any;
    if (setting) {
      setting.deletedAt = Date.now();
      this.settings.set(uuid, setting);
    }
  }

  async exists(uuid: string): Promise<boolean> {
    return this.settings.has(uuid);
  }

  async existsByKey(key: string, scope: SettingScope, contextUuid?: string): Promise<boolean> {
    return Array.from(this.settings.values()).some(
      (s: any) => s.key === key && s.scope === scope && s.contextUuid === contextUuid,
    );
  }

  async saveMany(settings: Setting[]): Promise<void> {
    settings.forEach((s: any) => this.settings.set(s.uuid, s));
  }

  async search(query: string, scope?: SettingScope): Promise<Setting[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.settings.values()).filter((s: any) => {
      const matchesQuery =
        s.key?.toLowerCase().includes(lowerQuery) || s.description?.toLowerCase().includes(lowerQuery);
      const matchesScope = !scope || s.scope === scope;
      return matchesQuery && matchesScope;
    });
  }

  // Test helpers
  clear(): void {
    this.settings.clear();
  }

  seed(settings: Setting[]): void {
    settings.forEach((s: any) => this.settings.set(s.uuid, s));
  }
}
