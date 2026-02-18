import type { ReminderBusEvent, ReminderTemplatePausedPayload } from './types';
import { ReminderHandlerSupport } from './reminder-handler-support';

export class ReminderTemplatePausedHandler {
  constructor(private readonly support: ReminderHandlerSupport) {}

  async handle(event: ReminderBusEvent<ReminderTemplatePausedPayload>): Promise<void> {
    await this.support.emitTemplateRefresh(event, 'template-paused');
    await this.support.pauseScheduleTaskForReminder(event.aggregateId);
  }
}
