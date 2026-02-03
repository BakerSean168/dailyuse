/**
 * Goal Created Event
 * 
 * Triggered when: New goal is created
 * Subscribers: Goal folder stats, User statistics, Notification service
 */
export interface GoalCreatedEvent {
  /** Goal unique identifier */
  goalId: string;

  /** User/Identity identifier */
  identityId: string;

  /** Parent folder identifier (if any) */
  folderId: string | null;

  /** Creation timestamp */
  createdAt: number;
}
