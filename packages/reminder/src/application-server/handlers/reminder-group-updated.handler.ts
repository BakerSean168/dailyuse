import type { ReminderBusEvent, ReminderGroupUpdatedPayload } from './types';
import { ReminderHandlerSupport } from './reminder-handler-support';

export class ReminderGroupUpdatedHandler {
  constructor(private readonly support: ReminderHandlerSupport) {}

  async handle(event: ReminderBusEvent<ReminderGroupUpdatedPayload>): Promise<void> {
    await this.support.emitGroupRefresh(event, 'group-updated');
  }
}
