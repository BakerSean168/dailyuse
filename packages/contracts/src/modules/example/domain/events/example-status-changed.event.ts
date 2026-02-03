/**
 * Example Status Changed Event
 * 
 * Triggered when: Example status transitions complete
 * Subscribers: Workflow engine, Notification service
 */
export interface ExampleStatusChangedEvent {
  /** Example unique identifier */
  id: string;
  
  /** Previous status value */
  oldStatus: string;
  
  /** New status value */
  newStatus: string;
  
  /** Status change timestamp */
  changedAt: number;
}
