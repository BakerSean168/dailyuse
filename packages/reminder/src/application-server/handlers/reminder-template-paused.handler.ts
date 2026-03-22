import type { ReminderBusEvent, ReminderTemplatePausedPayload } from './types';
import { ReminderHandlerSupport } from './reminder-handler-support';

export class ReminderTemplatePausedHandler {
  constructor(private readonly support: ReminderHandlerSupport) {}

  async handle(event: ReminderBusEvent<ReminderTemplatePausedPayload>): Promise<void> {
    await this.support.emitTemplateRefresh(event, 'template-paused');
    const templateId = this.support.resolveTemplateId(event);
    if (templateId) {
      await this.support.pauseScheduleTaskForReminder(templateId);
    }
  }
}
