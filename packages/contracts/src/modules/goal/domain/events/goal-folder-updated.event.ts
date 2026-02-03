/**
 * Goal Folder Updated Event
 * 
 * Triggered when: Goal folder properties are updated
 * Subscribers: User activity log, Folder cache
 * 
 * Note: aggregateId (folderId) is automatically set by the domain event system.
 * Note: occurredAt timestamp is automatically set by the domain event system.
 */
export interface GoalFolderUpdatedEvent {
  /** List of fields that were changed */
  changes: string[];
}
