import type { ReminderBusEvent, ReminderTemplateDeletedPayload } from './types';
import { ReminderHandlerSupport } from './reminder-handler-support';

export class ReminderTemplateDeletedHandler {
  constructor(private readonly support: ReminderHandlerSupport) {}

  async handle(event: ReminderBusEvent<ReminderTemplateDeletedPayload>): Promise<void> {
    await this.support.emitTemplateRefresh(event, 'template-deleted', {
      skipSnapshot: true,
    });
    const templateId = this.support.resolveTemplateId(event);
    if (templateId) {
      await this.support.deleteScheduleTaskForReminder(templateId);
    }
  }
}
