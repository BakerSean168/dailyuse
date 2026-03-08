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

/**
 * All IPC adapters for the Task module
 */
export interface TaskIpcAdapters {
  template: TaskTemplateIpcAdapter;
  instance: TaskInstanceIpcAdapter;
  dependency: TaskDependencyIpcAdapter;
}

/**
 * Create all Task IPC adapters from a single IIpcClient instance.
 * The concrete implementation (e.g. IpcClientImpl) is created at the App layer.
 *
 * @example
 * ```ts
 * // apps/desktop/src/renderer/modules/task/infrastructure/ipc/index.ts
 * const ipcClient = createIpcClient();
 * const adapters = createTaskIpcAdapters(ipcClient);
 * TaskContainer.getInstance()
 *   .registerTemplateApiClient(adapters.template)
 *   .registerInstanceApiClient(adapters.instance)
 *   .registerDependencyApiClient(adapters.dependency)
 * ```
 */
export function createTaskIpcAdapters(
  ipcClient: IResultIpcClient,
): TaskIpcAdapters {
  return {
    template: new TaskTemplateIpcAdapter(ipcClient),
    instance: new TaskInstanceIpcAdapter(ipcClient),
    dependency: new TaskDependencyIpcAdapter(ipcClient),
  };
}
