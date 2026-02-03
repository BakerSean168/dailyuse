/**
 * Password Changed Event
 * 
 * Triggered when: User changes password
 * Subscribers: Audit log, Security monitoring
 */
export interface PasswordChangedEvent {
  /** User/Identity identifier */
  identityId: string;

  /** Change timestamp */
  changedAt: number;
}
