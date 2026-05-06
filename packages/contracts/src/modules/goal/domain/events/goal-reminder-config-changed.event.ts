import type { GoalServerDTO } from '../../aggregates/goal-server';
import type { IdentityId } from '../../../../primitives';

/**
 * Goal Reminder Config Changed Event
 *
 * Triggered when: Goal reminder configuration changes
 * Subscribers: Schedule service
 */
export interface GoalReminderConfigChangedEvent {
  /** User/Identity identifier */
  identityId: IdentityId;

  /** Updated goal snapshot */
  goal: GoalServerDTO;

  /** Changed reminder config fields */
  changes: string[];
}
