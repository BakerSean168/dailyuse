/**
 * Example Deleted Event
 * 
 * Triggered when: Example aggregate is removed
 * Subscribers: Cleanup services, Audit log
 */
export interface ExampleDeletedEvent {
  /** Example unique identifier */
  id: string;
  
  /** Deletion timestamp */
  deletedAt: number;
}
