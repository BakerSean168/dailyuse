/**
 * Reminder Domain Event Map
 * 
 * Event Naming Convention: reminder:<action>
 * - reminder:create - Template created
 * - reminder:update - Template updated
 * - reminder:delete - Template deleted
 * - reminder:enable - Template enabled
 * - reminder:pause - Template paused
 * - reminder:trigger - Template triggered
 * - reminder:move - Template moved to group
 */

export type ReminderEventMap = {
  /**
   * Template created event
   */
  'reminder:create': {
    uuid: string;
    name: string;
    type: string;
    accountUuid: string;
    createdAt: number;
  };

  /**
   * Template updated event
   */
  'reminder:update': {
    uuid: string;
    changes: string[];
    updatedAt: number;
  };

  /**
   * Template deleted event
   */
  'reminder:delete': {
    uuid: string;
    name: string;
    deletedAt: number;
  };

  /**
   * Template enabled event
   */
  'reminder:enable': {
    uuid: string;
    enabledAt: number;
  };

  /**
   * Template paused event
   */
  'reminder:pause': {
    uuid: string;
    pausedAt: number;
  };

  /**
   * Template triggered event
   */
  'reminder:trigger': {
    uuid: string;
    triggeredAt: number;
    nextTriggerAt?: number | null;
  };

  /**
   * Template moved to group event
   */
  'reminder:move': {
    uuid: string;
    oldGroupUuid?: string | null;
    newGroupUuid?: string | null;
    movedAt: number;
  };
};

