/**
 * Goal Folder Updated Event
 * 
 * Triggered when: Goal folder properties are updated
 * Subscribers: User activity log, Folder cache
 */
export interface GoalFolderUpdatedEvent {
  /** Folder unique identifier */
  folderId: string;

  /** List of fields that were changed */
  changes: string[];

  /** Update timestamp */
  updatedAt: number;
}
