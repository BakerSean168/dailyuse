/**
 * User Logged In Event
 * 
 * Triggered when: User successfully logs in
 * Subscribers: Session tracking, Audit log, User activity
 */
export interface UserLoggedInEvent {
  /** User/Identity identifier */
  identityId: string;

  /** Login method (password, oauth2, etc) */
  method: string;

  /** Login timestamp */
  loginAt: number;
}
