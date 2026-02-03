/**
 * Goal Folder Deleted Event
 * 
 * Triggered when: Goal folder is deleted
 * Subscribers: Cleanup services, Audit log
 */
export interface GoalFolderDeletedEvent {
  /** Folder unique identifier */
  folderId: string;

  /** Deletion timestamp */
  deletedAt: number;

  /** Whether this is a soft delete */
  isSoftDelete: boolean;
}
