import type { GoalServerDTO } from '../../aggregates/goal-server';

/**
 * Goal Schedule Time Changed Event
 *
 * Triggered when: Goal time range changes (start/target dates)
 * Subscribers: Schedule service
 */
export interface GoalScheduleTimeChangedEvent {
  /** User/Identity identifier */
  identityId: string;

  /** Updated goal snapshot */
  goal: GoalServerDTO;

  /** Changed time fields */
  changes: string[];
}
