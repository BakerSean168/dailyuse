/**
 * Goal Folder Deleted Event
 * 
 * Triggered when: Goal folder is deleted
 * Subscribers: Cleanup services, Audit log
 * 
 * Note: aggregateId (folderId) is automatically set by the domain event system.
 * Note: occurredAt timestamp is automatically set by the domain event system.
 */
export interface GoalFolderDeletedEvent {
  /** Whether this is a soft delete */
  isSoftDelete: boolean;
}
