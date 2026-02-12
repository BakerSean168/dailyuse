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
  IHttpClient,
  IIpcClient,
} from './adapters/types';

// HTTP Adapters
export {
  TaskTemplateHttpAdapter,
  TaskInstanceHttpAdapter,
  TaskDependencyHttpAdapter,
  TaskStatisticsHttpAdapter,
  createTaskHttpAdapters,
  type TaskHttpAdapters,
} from './adapters/http';

// IPC Adapters
export {
  TaskTemplateIpcAdapter,
  TaskInstanceIpcAdapter,
  TaskDependencyIpcAdapter,
  TaskStatisticsIpcAdapter,
  createTaskIpcAdapters,
  type TaskIpcAdapters,
} from './adapters/ipc';

