/**
 * Key Result Updated Event
 * 
 * Triggered when: Key result progress is updated
 * Subscribers: Goal progress calculator, User notifications
 */
export interface KeyResultUpdatedEvent {
  /** Goal unique identifier */
  goalId: string;

  /** Key result unique identifier */
  keyResultId: string;

  /** Previous progress value */
  previousValue: number;

  /** New progress value */
  newValue: number;

  /** Update timestamp */
  updatedAt: number;
}
