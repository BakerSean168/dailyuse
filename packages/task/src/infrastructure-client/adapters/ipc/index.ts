/**
 * Task IPC Adapters - Registration
 *
 * Barrel file for all IPC-based Task adapters.
 * Provides factory function to create all IPC adapters at once.
 */

import type { IResultIpcClient } from '../types';
import { TaskTemplateIpcAdapter } from './task-template-ipc.adapter';
import { TaskInstanceIpcAdapter } from './task-instance-ipc.adapter';
import { TaskDependencyIpcAdapter } from './task-dependency-ipc.adapter';

// Re-export adapters
export { TaskTemplateIpcAdapter } from './task-template-ipc.adapter';
export { TaskInstanceIpcAdapter } from './task-instance-ipc.adapter';
export { TaskDependencyIpcAdapter } from './task-dependency-ipc.adapter';
export { createTaskTemplateIpcAdapter } from './task-template-ipc.adapter';
export { createTaskInstanceIpcAdapter } from './task-instance-ipc.adapter';
export { createTaskDependencyIpcAdapter } from './task-dependency-ipc.adapter';

/**
 * All IPC adapters for the Task module
 */
export interface TaskIpcAdapters {
  template: TaskTemplateIpcAdapter;
  instance: TaskInstanceIpcAdapter;
  dependency: TaskDependencyIpcAdapter;
}

/**
 * Create all Task IPC adapters from a single IResultIpcClient instance.
 * Desktop DI injects ResultIpcClient from createResultIpcClient().
 *
 * @example
 * ```ts
 * const ipcClient = createResultIpcClient({ bridge });
 * const adapters = createTaskIpcAdapters(ipcClient);
 * ```
 */
export function createTaskIpcAdapters(ipcClient: IResultIpcClient): TaskIpcAdapters {
  return {
    template: new TaskTemplateIpcAdapter(ipcClient),
    instance: new TaskInstanceIpcAdapter(ipcClient),
    dependency: new TaskDependencyIpcAdapter(ipcClient),
  };
}
