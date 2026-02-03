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
  'example:create': {
    id: string;
    name: string;
    createdAt: number;
  };

  /**
   * Example updated event
   * Emitted when Example is updated
   */
  'example:update': {
    id: string;
    updatedFields: string[];
    updatedAt: number;
  };

  /**
   * Example deleted event
   * Emitted when Example is deleted
   */
  'example:delete': {
    id: string;
    deletedAt: number;
  };

  /**
   * Example status changed event
   * Emitted when Example status changes
   */
  'example:status-change': {
    id: string;
    oldStatus: string;
    newStatus: string;
    changedAt: number;
  };
};
};
