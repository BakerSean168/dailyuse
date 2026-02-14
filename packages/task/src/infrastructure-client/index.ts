/**
 * Task Module - Infrastructure Client
 *
 * Adapters and container for Task module communication.
 */

// Container
export {
  TaskContainer,
  TaskDependencyKeys,
  type ITaskTemplateRepository,
  type ITaskInstanceRepository,
} from './task.container';

// Port Interfaces
export type {
  ITaskTemplateApiClient,
  ITaskInstanceApiClient,
  ITaskDependencyApiClient,
  ITaskStatisticsApiClient,
  IIpcClient,
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

