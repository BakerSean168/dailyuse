/**
 * Schedule HTTP Adapters - Registration
 *
 * Barrel file for all HTTP-based Schedule adapters.
 * Provides factory function to create all HTTP adapters at once.
 */

import type { IResultHttpClient } from '@memoflow/http-client';
import { ScheduleEventHttpAdapter } from './schedule-event-http.adapter';
import { ScheduleTaskHttpAdapter } from './schedule-task-http.adapter';

// Re-export adapters
export { ScheduleEventHttpAdapter } from './schedule-event-http.adapter';
export { ScheduleTaskHttpAdapter } from './schedule-task-http.adapter';

/**
 * All HTTP adapters for the Schedule module
 */
export interface ScheduleHttpAdapters {
  event: ScheduleEventHttpAdapter;
  task: ScheduleTaskHttpAdapter;
}

/**
 * Create all Schedule HTTP adapters from a single IResultHttpClient instance.
 * The concrete implementation (e.g. ResultHttpClient) is created at the App layer.
 */
export function createScheduleHttpAdapters(
  httpClient: IResultHttpClient,
): ScheduleHttpAdapters {
  return {
    event: new ScheduleEventHttpAdapter(httpClient),
    task: new ScheduleTaskHttpAdapter(httpClient),
  };
}
