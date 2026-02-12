/**
 * Notification HTTP Adapters - Registration
 */

import type { IHttpClient } from '../types';
import { NotificationHttpAdapter } from './notification-http.adapter';

export { NotificationHttpAdapter, createNotificationHttpAdapter } from './notification-http.adapter';

export interface NotificationHttpAdapters {
  notification: NotificationHttpAdapter;
}

export function createNotificationHttpAdapters(httpClient: IHttpClient): NotificationHttpAdapters {
  return { notification: new NotificationHttpAdapter(httpClient) };
}
