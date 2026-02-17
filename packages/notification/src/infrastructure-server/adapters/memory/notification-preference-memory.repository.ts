/**
 * NotificationPreference Memory Repository
 *
 * In-memory implementation of INotificationPreferenceRepository for testing.
 */

import type { INotificationPreferenceRepository } from '../../../domain-server';
import type { NotificationPreference } from '../../../domain-server/aggregates/notification-preference';

/**
 * NotificationPreference Memory Repository
 *
 * In-memory implementation for testing purposes.
 */
export class NotificationPreferenceMemoryRepository implements INotificationPreferenceRepository {
  private preferences = new Map<string, NotificationPreference>();
  private accountIndex = new Map<string, string>(); // identityId -> id

  async save(preference: NotificationPreference): Promise<void> {
    const pref = preference as any;
    this.preferences.set(pref.id, preference);
    this.accountIndex.set(pref.identityId, pref.id);
  }

  async findById(id: string): Promise<NotificationPreference | null> {
    return this.preferences.get(id) ?? null;
  }

  async findByIdentityId(identityId: string): Promise<NotificationPreference | null> {
    const id = this.accountIndex.get(identityId);
    return id ? this.preferences.get(id) ?? null : null;
  }

  async delete(id: string): Promise<void> {
    const pref = this.preferences.get(id) as any;
    if (pref) {
      this.accountIndex.delete(pref.identityId);
      this.preferences.delete(id);
    }
  }

  async exists(id: string): Promise<boolean> {
    return this.preferences.has(id);
  }

  async existsForIdentity(identityId: string): Promise<boolean> {
    return this.accountIndex.has(identityId);
  }

  async getOrCreate(identityId: string): Promise<NotificationPreference> {
    const existing = await this.findByIdentityId(identityId);
    if (existing) return existing;

    // Create default preference - in real implementation, use domain factory
    const id = `pref-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const defaultPref = {
      id,
      identityId,
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
      this.preferences.set(p.id, p);
      this.accountIndex.set(p.identityId, p.id);
    });
  }
}
