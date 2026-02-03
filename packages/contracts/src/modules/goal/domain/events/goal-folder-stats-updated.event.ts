/**
 * Goal Folder Statistics Updated Event
 * 
 * Triggered when: Folder statistics (goal count, completion rate) change
 * Subscribers: Folder cache, User dashboard
 * 
 * Note: aggregateId (folderId) is automatically set by the domain event system.
 * Note: occurredAt timestamp is automatically set by the domain event system.
 */
export interface GoalFolderStatsUpdatedEvent {
  /** Total number of goals in folder */
  goalCount: number;

  /** Number of completed goals */
  completedGoalCount: number;
}
