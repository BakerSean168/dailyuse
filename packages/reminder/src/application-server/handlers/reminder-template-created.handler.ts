import type { ReminderBusEvent, ReminderTemplateCreatedPayload } from './types';
import { ReminderHandlerSupport } from './reminder-handler-support';

export class ReminderTemplateCreatedHandler {
  constructor(private readonly support: ReminderHandlerSupport) {}

  async handle(event: ReminderBusEvent<ReminderTemplateCreatedPayload>): Promise<void> {
    await this.support.emitTemplateRefresh(event, 'template-created', {
      includePayloadSnapshot: true,
    });
    await this.support.createScheduleTaskForReminder(event);
  }
}
