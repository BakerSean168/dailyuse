/**
 * User Logged Out Event
 * 
 * Triggered when: User logs out
 * Subscribers: Session cleanup, Audit log
 */
export interface UserLoggedOutEvent {
  /** User/Identity identifier */
  identityId: string;

  /** Logout timestamp */
  logoutAt: number;
}
