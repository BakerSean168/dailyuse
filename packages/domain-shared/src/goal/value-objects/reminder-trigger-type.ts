import type { ReminderTriggerType as IReminderTriggerType } from '@dailyuse/contracts/goal';

export type ReminderTriggerType = IReminderTriggerType & { readonly __brand: unique symbol };

const VALUES: IReminderTriggerType[] = ['TimeProgressPercentage', 'RemainingDays'];

export const ReminderTriggerType = {
  TimeProgressPercentage: 'TimeProgressPercentage' as ReminderTriggerType,
  RemainingDays: 'RemainingDays' as ReminderTriggerType,

  of(value: string): ReminderTriggerType {
    if (!this.isValid(value)) {
      throw new Error(`Invalid ReminderTriggerType: ${value}`);
    }
    return value as ReminderTriggerType;
  },

  isValid(value: string): value is ReminderTriggerType {
    return VALUES.includes(value as IReminderTriggerType);
  },

  getAll(): ReminderTriggerType[] {
    return VALUES as ReminderTriggerType[];
  },

  isTimeProgress(type: ReminderTriggerType): boolean {
    return type === this.TimeProgressPercentage;
  },

  isRemainingDays(type: ReminderTriggerType): boolean {
    return type === this.RemainingDays;
  },
};
