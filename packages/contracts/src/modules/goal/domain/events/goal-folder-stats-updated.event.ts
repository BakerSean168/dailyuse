/**
 * Goal Folder Statistics Updated Event
 * 
 * Triggered when: Folder statistics (goal count, completion rate) change
 * Subscribers: Folder cache, User dashboard
 */
export interface GoalFolderStatsUpdatedEvent {
  /** Folder unique identifier */
  folderId: string;

  /** Total number of goals in folder */
  goalCount: number;

  /** Number of completed goals */
  completedGoalCount: number;

  /** Update timestamp */
  updatedAt: number;
}
