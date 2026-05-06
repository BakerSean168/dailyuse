import type { GoalServerDTO } from '../../aggregates/goal-server';
import type { IdentityId } from '../../../../primitives';

/**
 * Goal Schedule Time Changed Event
 *
 * Triggered when: Goal time range changes (start/target dates)
 * Subscribers: Schedule service
 */
export interface GoalScheduleTimeChangedEvent {
  /** User/Identity identifier */
  identityId: IdentityId;

  /** Updated goal snapshot */
  goal: GoalServerDTO;

  /** Changed time fields */
  changes: string[];
}
