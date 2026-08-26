/**
 * Task Module - Infrastructure Client
 *
 * Adapters for Task module communication.
 */

// Port Interfaces
export type {
  ITaskTemplateApiClient,
  ITaskInstanceApiClient,
  IResultIpcClient,
  TaskTemplateListParams,
} from './adapters/types';

// HTTP Adapters
export {
  TaskTemplateHttpAdapter,
  TaskInstanceHttpAdapter,
  createTaskHttpAdapters,
  type TaskHttpAdapters,
} from './adapters/http';

// IPC Adapters
export {
  TaskTemplateIpcAdapter,
  TaskInstanceIpcAdapter,
  createTaskIpcAdapters,
  type TaskIpcAdapters,
} from './adapters/ipc';
