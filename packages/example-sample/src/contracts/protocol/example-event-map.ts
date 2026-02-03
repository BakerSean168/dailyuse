import type {
  ExampleCreatedEvent,
  ExampleDeletedEvent,
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
  'example:created': ExampleCreatedEvent;

  /**
   * Example deleted event
   * Emitted when Example is deleted
   */
  'example:deleted': ExampleDeletedEvent;
};

