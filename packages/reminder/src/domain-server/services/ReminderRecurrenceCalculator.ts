import type { ReminderTemplate } from '../aggregates/reminder-template';
import { UpcomingReminderCalculationService } from './UpcomingReminderCalculationService';

export class ReminderRecurrenceCalculator {
  public static calculateNextTriggerTime(
    template: ReminderTemplate,
    afterTime: number = Date.now(),
  ): number | null {
    return UpcomingReminderCalculationService.calculateNextTriggerTime(
      template.toServerDTO(),
      afterTime,
    );
  }
}
