/**
 * NotificationPreference Memory Repository
 *
 * In-memory implementation of INotificationPreferenceRepository for testing.
 */

import type { INotificationPreferenceRepository } from '../../ports/notification-preference-repository.port';
import type { NotificationPreference } from '@/domain-server';

/**
 * NotificationPreference Memory Repository
 *
 * In-memory implementation for testing purposes.
 */
export class NotificationPreferenceMemoryRepository implements INotificationPreferenceRepository {
  private preferences = new Map<string, NotificationPreference>();
  private accountIndex = new Map<string, string>(); // accountUuid -> uuid

  async save(preference: NotificationPreference): Promise<void> {
    const pref = preference as any;
    this.preferences.set(pref.uuid, preference);
    this.accountIndex.set(pref.accountUuid, pref.uuid);
  }

  async findById(uuid: string): Promise<NotificationPreference | null> {
    return this.preferences.get(uuid) ?? null;
  }

  async findByAccountUuid(accountUuid: string): Promise<NotificationPreference | null> {
    const uuid = this.accountIndex.get(accountUuid);
    return uuid ? this.preferences.get(uuid) ?? null : null;
  }

  async delete(uuid: string): Promise<void> {
    const pref = this.preferences.get(uuid) as any;
    if (pref) {
      this.accountIndex.delete(pref.accountUuid);
      this.preferences.delete(uuid);
    }
  }

  async exists(uuid: string): Promise<boolean> {
    return this.preferences.has(uuid);
  }

  async existsForAccount(accountUuid: string): Promise<boolean> {
    return this.accountIndex.has(accountUuid);
  }

  async getOrCreate(accountUuid: string): Promise<NotificationPreference> {
    const existing = await this.findByAccountUuid(accountUuid);
    if (existing) return existing;

    // Create default preference - in real implementation, use domain factory
    const uuid = `pref-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const defaultPref = {
      uuid,
      accountUuid,
      emailEnabled: true,
      pushEnabled: true,
      inAppEnabled: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    } as unknown as NotificationPreference;
    await this.save(defaultPref);
    return defaultPref;
  }

  // Test helpers
  clear(): void {
    this.preferences.clear();
    this.accountIndex.clear();
  }

  seed(preferences: NotificationPreference[]): void {
    preferences.forEach((p: any) => {
      this.preferences.set(p.uuid, p);
      this.accountIndex.set(p.accountUuid, p.uuid);
    });
  }
}
