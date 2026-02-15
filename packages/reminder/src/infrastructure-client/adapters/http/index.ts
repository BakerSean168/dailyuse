/**
 * Reminder HTTP Adapters - Registration
 */

import type { IResultHttpClient } from '@dailyuse/http-client';
import { ReminderHttpAdapter } from './reminder-http.adapter';

export { ReminderHttpAdapter, createReminderHttpAdapter } from './reminder-http.adapter';

export interface ReminderHttpAdapters {
  reminder: ReminderHttpAdapter;
}

export function createReminderHttpAdapters(httpClient: IResultHttpClient): ReminderHttpAdapters {
  return { reminder: new ReminderHttpAdapter(httpClient) };
}
