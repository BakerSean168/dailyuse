import type { ReminderBusEvent, ReminderGroupCreatedPayload } from './types';
import { ReminderHandlerSupport } from './reminder-handler-support';

export class ReminderGroupCreatedHandler {
  constructor(private readonly support: ReminderHandlerSupport) {}

  async handle(event: ReminderBusEvent<ReminderGroupCreatedPayload>): Promise<void> {
    await this.support.emitGroupRefresh(event, 'group-created');
  }
}
