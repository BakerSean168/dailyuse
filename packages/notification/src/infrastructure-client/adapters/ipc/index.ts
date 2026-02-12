/**
 * Notification IPC Adapters - Registration
 */

import type { IIpcClient } from '../types';
import { NotificationIpcAdapter } from './notification-ipc.adapter';

export { NotificationIpcAdapter, createNotificationIpcAdapter } from './notification-ipc.adapter';

export interface NotificationIpcAdapters {
  notification: NotificationIpcAdapter;
}

export function createNotificationIpcAdapters(ipcClient: IIpcClient): NotificationIpcAdapters {
  return { notification: new NotificationIpcAdapter(ipcClient) };
}
