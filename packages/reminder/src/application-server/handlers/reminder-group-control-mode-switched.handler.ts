import type {
  ReminderBusEvent,
  ReminderGroupControlModeSwitchedPayload,
} from './types';
import { ReminderHandlerSupport } from './reminder-handler-support';

export class ReminderGroupControlModeSwitchedHandler {
  constructor(private readonly support: ReminderHandlerSupport) {}

  async handle(event: ReminderBusEvent<ReminderGroupControlModeSwitchedPayload>): Promise<void> {
    await this.support.emitGroupRefresh(event, 'group-control-mode-changed');
  }
}
