import type { ReminderBusEvent, ReminderGroupDeletedPayload } from './types';
import { ReminderHandlerSupport } from './reminder-handler-support';

export class ReminderGroupDeletedHandler {
  constructor(private readonly support: ReminderHandlerSupport) {}

  async handle(event: ReminderBusEvent<ReminderGroupDeletedPayload>): Promise<void> {
    await this.support.emitGroupRefresh(event, 'group-deleted', {
      skipSnapshot: true,
    });
  }
}
