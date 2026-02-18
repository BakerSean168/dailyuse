import type { ReminderBusEvent, ReminderTemplateEnabledPayload } from './types';
import { ReminderHandlerSupport } from './reminder-handler-support';

export class ReminderTemplateEnabledHandler {
  constructor(private readonly support: ReminderHandlerSupport) {}

  async handle(event: ReminderBusEvent<ReminderTemplateEnabledPayload>): Promise<void> {
    await this.support.emitTemplateRefresh(event, 'template-enabled');
    await this.support.enableScheduleTaskForReminder(event.aggregateId);
  }
}
