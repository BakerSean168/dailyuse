/**
 * Account Created Event
 * 
 * Triggered when: New account is created
 * Subscribers: Account lifecycle, User service
 */
export interface AccountCreatedEvent {
  /** Account unique identifier */
  accountId: string;

  /** User/Identity identifier */
  identityId: string;

  /** Creation timestamp */
  createdAt: number;
}
