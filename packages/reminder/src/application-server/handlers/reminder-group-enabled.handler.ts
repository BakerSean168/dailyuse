import type { ReminderBusEvent, ReminderGroupEnabledPayload } from './types';
import { ReminderHandlerSupport } from './reminder-handler-support';

export class ReminderGroupEnabledHandler {
  constructor(private readonly support: ReminderHandlerSupport) {}

  async handle(event: ReminderBusEvent<ReminderGroupEnabledPayload>): Promise<void> {
    await this.support.emitGroupRefresh(event, 'group-enabled');
  }
}
