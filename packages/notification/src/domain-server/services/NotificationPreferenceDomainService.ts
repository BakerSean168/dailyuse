/**
 * NotificationPreference Domain Service
 *
 * Handles preference-related domain logic that spans
 * across the NotificationPreference aggregate.
 */

import type { INotificationPreferenceRepository } from '../repositories/INotificationPreferenceRepository';
import type { NotificationPreference } from '../aggregates/notification-preference';

/**
 * NotificationPreferenceDomainService
 *
 * Responsibilities:
 * - Retrieve user notification preferences
 * - Get or create default preferences for an account
 */
export class NotificationPreferenceDomainService {
  constructor(
    private readonly preferenceRepo: INotificationPreferenceRepository,
  ) {}

  /**
   * Get preference for a specific account
   */
  async getPreference(accountUuid: string): Promise<NotificationPreference | null> {
    return this.preferenceRepo.findByAccountUuid(accountUuid);
  }

  /**
   * Get or create default preference for an account
   */
  async getOrCreatePreference(accountUuid: string): Promise<NotificationPreference> {
    return this.preferenceRepo.getOrCreate(accountUuid);
  }
}
