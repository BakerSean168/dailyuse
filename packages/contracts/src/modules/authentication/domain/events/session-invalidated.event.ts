/**
 * Session Invalidated Event
 * 
 * Triggered when: User session is invalidated (logout, password change, etc)
 * Subscribers: Session cleanup service
 */
export interface SessionInvalidatedEvent {
  /** User/Identity identifier */
  identityId: string;

  /** Invalidation timestamp */
  invalidatedAt: number;
}
