/**
 * Task Module - Infrastructure Client
 *
 * Ports and Adapters for Task module communication.
 */

// Container
export {
  TaskContainer,
  TaskDependencyKeys,
  type ITaskTemplateRepository,
  type ITaskInstanceRepository,
} from './task.container';

// Ports (Interfaces)
export { type ITaskTemplateApiClient } from './ports/task-template-api-client.port';
export { type ITaskInstanceApiClient } from './ports/task-instance-api-client.port';
export { type ITaskDependencyApiClient } from './ports/task-dependency-api-client.port';
export { type ITaskStatisticsApiClient } from './ports/task-statistics-api-client.port';

// HTTP Adapters
export {
  TaskTemplateHttpAdapter,
  createTaskTemplateHttpAdapter,
} from './adapters/http/task-template-http.adapter';
export {
  TaskInstanceHttpAdapter,
  createTaskInstanceHttpAdapter,
} from './adapters/http/task-instance-http.adapter';
export {
  TaskDependencyHttpAdapter,
  createTaskDependencyHttpAdapter,
} from './adapters/http/task-dependency-http.adapter';
export {
  TaskStatisticsHttpAdapter,
  createTaskStatisticsHttpAdapter,
} from './adapters/http/task-statistics-http.adapter';

// IPC Adapters
export {
  TaskTemplateIpcAdapter,
  createTaskTemplateIpcAdapter,
} from './adapters/ipc/task-template-ipc.adapter';
export {
  TaskInstanceIpcAdapter,
  createTaskInstanceIpcAdapter,
} from './adapters/ipc/task-instance-ipc.adapter';
export {
  TaskDependencyIpcAdapter,
  createTaskDependencyIpcAdapter,
} from './adapters/ipc/task-dependency-ipc.adapter';
export {
  TaskStatisticsIpcAdapter,
  createTaskStatisticsIpcAdapter,
} from './adapters/ipc/task-statistics-ipc.adapter';
