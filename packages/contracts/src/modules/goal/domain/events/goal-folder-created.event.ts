/**
 * Goal Folder Created Event
 * 
 * Triggered when: New goal folder is created
 * Subscribers: User folder tree, Folder statistics
 */
export interface GoalFolderCreatedEvent {
  /** Folder unique identifier */
  folderId: string;

  /** User/Identity identifier */
  identityId: string;

  /** Creation timestamp */
  createdAt: number;
}
