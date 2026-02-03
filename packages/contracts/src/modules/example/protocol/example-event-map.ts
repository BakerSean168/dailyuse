import type {
  ExampleCreatedEvent,
  ExampleUpdatedEvent,
  ExampleDeletedEvent,
  ExampleStatusChangedEvent,
} from '../domain/events';

/**
 * Example Module - Event Map
 * 
 * Event Naming Convention: example:<action>
 * - example:create - Example created
 * - example:update - Example updated
 * - example:delete - Example deleted
 * - example:status-change - Example status changed
 */
export type ExampleEventMap = {
  /**
   * Example created event
   * Emitted when new Example is created
   */
  'example:create': ExampleCreatedEvent;

  /**
   * Example updated event
   * Emitted when Example is updated
   */
  'example:update': ExampleUpdatedEvent;

  /**
   * Example deleted event
   * Emitted when Example is deleted
   */
  'example:delete': ExampleDeletedEvent;

  /**
   * Example status changed event
   * Emitted when Example status changes
   */
  'example:status-change': ExampleStatusChangedEvent;
};

