/**
 * Reminder IPC Adapters - Registration
 */

import type { IResultIpcClient } from '../types';
import { ReminderIpcAdapter } from './reminder-ipc.adapter';

export { ReminderIpcAdapter, createReminderIpcAdapter } from './reminder-ipc.adapter';

export interface ReminderIpcAdapters {
  reminder: ReminderIpcAdapter;
}

export function createReminderIpcAdapters(ipcClient: IResultIpcClient): ReminderIpcAdapters {
  return { reminder: new ReminderIpcAdapter(ipcClient) };
}
