import type { ReminderBusEvent, ReminderGroupPausedPayload } from './types';
import { ReminderHandlerSupport } from './reminder-handler-support';

export class ReminderGroupPausedHandler {
  constructor(private readonly support: ReminderHandlerSupport) {}

  async handle(event: ReminderBusEvent<ReminderGroupPausedPayload>): Promise<void> {
    await this.support.emitGroupRefresh(event, 'group-paused');
  }
}
