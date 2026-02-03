/**
 * Example Updated Event
 * 
 * Triggered when: Example aggregate is modified
 * Subscribers: Notification module, Search indexing service, Audit log
 */
export interface ExampleUpdatedEvent {
  /** Example unique identifier */
  id: string;
  
  /** List of updated field names */
  updatedFields: string[];
  
  /** Update timestamp */
  updatedAt: number;
}
