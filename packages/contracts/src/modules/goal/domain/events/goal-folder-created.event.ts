/**
 * Goal Folder Created Event
 * 
 * Triggered when: New goal folder is created
 * Subscribers: User folder tree, Folder statistics
 * 
 * Note: aggregateId (folderId) is automatically set by the domain event system.
 * Note: occurredAt timestamp is automatically set by the domain event system.
 */
export interface GoalFolderCreatedEvent {
  /** User/Identity identifier */
  identityId: string;
}
