/**
 * Setting Memory Repository
 *
 * In-memory implementation of ISettingRepository for testing.
 */

import type { ISettingRepository } from '../../domain-server';
import type { Setting } from '@/domain-server/aggregates/setting';
import type { SettingScope } from '@dailyuse/contracts/setting';

/**
 * Setting Memory Repository
 *
 * In-memory implementation for testing purposes.
 */
export class SettingMemoryRepository implements ISettingRepository {
  private settings = new Map<string, Setting>();

  async save(setting: Setting): Promise<void> {
    this.settings.set((setting as any).id, setting);
  }

  async findById(id: string, _options?: { includeHistory?: boolean }): Promise<Setting | null> {
    return this.settings.get(id) ?? null;
  }

  async findByKey(key: string, scope: SettingScope, contextId?: string): Promise<Setting | null> {
    return (
      Array.from(this.settings.values()).find(
        (s: any) => s.key === key && s.scope === scope && s.contextId === contextId,
      ) ?? null
    );
  }

  async findByScope(
    scope: SettingScope,
    contextId?: string,
    _options?: { includeHistory?: boolean },
  ): Promise<Setting[]> {
    return Array.from(this.settings.values()).filter(
      (s: any) => s.scope === scope && (!contextId || s.contextId === contextId),
    );
  }

  async findByGroup(groupId: string, _options?: { includeHistory?: boolean }): Promise<Setting[]> {
    return Array.from(this.settings.values()).filter((s: any) => s.groupId === groupId);
  }

  async findSystemSettings(_options?: { includeHistory?: boolean }): Promise<Setting[]> {
    return Array.from(this.settings.values()).filter((s: any) => s.scope === 'SYSTEM');
  }

  async findUserSettings(identityId: string, _options?: { includeHistory?: boolean }): Promise<Setting[]> {
    return Array.from(this.settings.values()).filter(
      (s: any) => s.scope === 'USER' && s.contextId === identityId,
    );
  }

  async findDeviceSettings(deviceId: string, _options?: { includeHistory?: boolean }): Promise<Setting[]> {
    return Array.from(this.settings.values()).filter(
      (s: any) => s.scope === 'DEVICE' && s.contextId === deviceId,
    );
  }

  async delete(id: string): Promise<void> {
    const setting = this.settings.get(id) as any;
    if (setting) {
      setting.deletedAt = Date.now();
      this.settings.set(id, setting);
    }
  }

  async exists(id: string): Promise<boolean> {
    return this.settings.has(id);
  }

  async existsByKey(key: string, scope: SettingScope, contextId?: string): Promise<boolean> {
    return Array.from(this.settings.values()).some(
      (s: any) => s.key === key && s.scope === scope && s.contextId === contextId,
    );
  }

  async saveMany(settings: Setting[]): Promise<void> {
    settings.forEach((s: any) => this.settings.set(s.id, s));
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
    settings.forEach((s: any) => this.settings.set(s.id, s));
  }
}
