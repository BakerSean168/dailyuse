/**
 * Reminder HTTP Adapters - Registration
 */

import type { IHttpClient } from '../types';
import { ReminderHttpAdapter } from './reminder-http.adapter';

export { ReminderHttpAdapter, createReminderHttpAdapter } from './reminder-http.adapter';

export interface ReminderHttpAdapters {
  reminder: ReminderHttpAdapter;
}

export function createReminderHttpAdapters(httpClient: IHttpClient): ReminderHttpAdapters {
  return { reminder: new ReminderHttpAdapter(httpClient) };
}
