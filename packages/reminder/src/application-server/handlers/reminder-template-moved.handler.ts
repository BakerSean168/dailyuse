import type { ReminderBusEvent, ReminderTemplateMovedPayload } from './types';
import { ReminderHandlerSupport } from './reminder-handler-support';

export class ReminderTemplateMovedHandler {
  constructor(private readonly support: ReminderHandlerSupport) {}

  async handle(event: ReminderBusEvent<ReminderTemplateMovedPayload>): Promise<void> {
    await this.support.emitTemplateRefresh(event, 'template-moved');
  }
}
