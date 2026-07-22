/**
 * NotificationPreference repository interface.
 *
 * DDD repository pattern:
 * - Interface only; infrastructure implements
 * - Each account has at most one preference document
 */

import type { NotificationPreference } from '../aggregates/notification-preference';

export interface INotificationPreferenceRepository {
  /**
   * Save preference (create or update)
   */
  save(preference: NotificationPreference): Promise<void>;

  /**
   * Find by primary key (system/internal paths; authorization-sensitive loads use findByIdForIdentity)
   */
  findById(id: string): Promise<NotificationPreference | null>;

  /**
   * Find by primary key scoped to identity
   */
  findByIdForIdentity(identityId: string, id: string): Promise<NotificationPreference | null>;

  /**
   * Find preference by account identity
   */
  findByIdentityId(identityId: string): Promise<NotificationPreference | null>;

  /**
   * Delete preference (must match identity)
   */
  delete(identityId: string, id: string): Promise<void>;

  /**
   * Check existence scoped to identity
   */
  exists(identityId: string, id: string): Promise<boolean>;

  /**
   * Check whether the account already has a preference
   */
  existsForIdentity(identityId: string): Promise<boolean>;

  /**
   * Get or create default preference for identity
   */
  getOrCreate(identityId: string): Promise<NotificationPreference>;
}
