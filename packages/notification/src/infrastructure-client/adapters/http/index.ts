/**
 * Notification HTTP Adapters - Registration
 */

import type { IResultHttpClient } from '@dailyuse/http-client';
import { NotificationHttpAdapter } from './notification-http.adapter';

export { NotificationHttpAdapter, createNotificationHttpAdapter } from './notification-http.adapter';

export interface NotificationHttpAdapters {
  notification: NotificationHttpAdapter;
}

export function createNotificationHttpAdapters(httpClient: IResultHttpClient): NotificationHttpAdapters {
  return { notification: new NotificationHttpAdapter(httpClient) };
}
