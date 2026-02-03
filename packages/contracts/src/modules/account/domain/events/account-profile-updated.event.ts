/**
 * Account Profile Updated Event
 * 
 * Triggered when: User profile information is updated
 * Subscribers: Profile cache, User service
 */
export interface AccountProfileUpdatedEvent {
  /** Account unique identifier */
  accountId: string;

  /** List of fields that were changed */
  changes: string[];

  /** Update timestamp */
  updatedAt: number;
}
