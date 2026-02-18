import type { ReminderBusEvent, ReminderTemplateUpdatedPayload } from './types';
import { ReminderHandlerSupport } from './reminder-handler-support';

export class ReminderTemplateUpdatedHandler {
  constructor(private readonly support: ReminderHandlerSupport) {}

  async handle(event: ReminderBusEvent<ReminderTemplateUpdatedPayload>): Promise<void> {
    await this.support.emitTemplateRefresh(event, 'template-updated');
  }
}
