/**
 * Example Created Event
 * 
 * Triggered when: Example aggregate is successfully persisted
 * Subscribers: Notification module, Search indexing service, Audit log
 */
export interface ExampleCreatedEvent {
  /** Example unique identifier */
  id: string;
  
  /** Example name */
  name: string;
  
  /** Creation timestamp */
  createdAt: number;
}
