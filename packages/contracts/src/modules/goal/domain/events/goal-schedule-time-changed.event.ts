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
  goal: any;

  /** Changed time fields */
  changes: string[];
}
