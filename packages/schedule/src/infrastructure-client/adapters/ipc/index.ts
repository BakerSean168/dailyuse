/**
 * Schedule IPC Adapters - Registration
 *
 * Barrel file for all IPC-based Schedule adapters.
 * Provides factory function to create all IPC adapters at once.
 */

import type { IResultIpcClient } from '../types';
import { ScheduleEventIpcAdapter } from './schedule-event-ipc.adapter';
import { ScheduleTaskIpcAdapter } from './schedule-task-ipc.adapter';

// Re-export adapters
export { ScheduleEventIpcAdapter } from './schedule-event-ipc.adapter';
export { ScheduleTaskIpcAdapter } from './schedule-task-ipc.adapter';

/**
 * All IPC adapters for the Schedule module
 */
export interface ScheduleIpcAdapters {
  event: ScheduleEventIpcAdapter;
  task: ScheduleTaskIpcAdapter;
}

/**
 * Create all Schedule IPC adapters from a single IResultIpcClient instance.
 * Desktop DI injects ResultIpcClient from createResultIpcClient().
 */
export function createScheduleIpcAdapters(
  ipcClient: IResultIpcClient,
): ScheduleIpcAdapters {
  return {
    event: new ScheduleEventIpcAdapter(ipcClient),
    task: new ScheduleTaskIpcAdapter(ipcClient),
  };
}
