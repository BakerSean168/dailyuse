/**
 * Task Module - Infrastructure Client
 *
 * Adapters for Task module communication.
 */

// Port Interfaces
export type {
  ITaskTemplateApiClient,
  ITaskInstanceApiClient,
  ITaskDependencyApiClient,
  IResultIpcClient,
  TaskTemplateListParams,
} from './adapters/types';

// HTTP Adapters
export {
  TaskTemplateHttpAdapter,
  TaskInstanceHttpAdapter,
  TaskDependencyHttpAdapter,
  createTaskHttpAdapters,
  type TaskHttpAdapters,
} from './adapters/http';

// IPC Adapters
export {
  TaskTemplateIpcAdapter,
  TaskInstanceIpcAdapter,
  TaskDependencyIpcAdapter,
  createTaskIpcAdapters,
  type TaskIpcAdapters,
} from './adapters/ipc';
