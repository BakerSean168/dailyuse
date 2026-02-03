/**
 * Account Closed Event
 * 
 * Triggered when: Account is closed/deleted
 * Subscribers: Data cleanup, Account statistics
 */
export interface AccountClosedEvent {
  /** Account unique identifier */
  accountId: string;

  /** Closure timestamp */
  closedAt: number;
}
