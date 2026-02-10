/**
 * Schedule Module - Infrastructure Client
 *
 * Ports and Adapters for Schedule module communication.
 */

// Container
export {
  ScheduleContainer,
  ScheduleDependencyKeys,
  type IScheduleTaskRepository,
  type IScheduleEventRepository,
} from './schedule.container';

// Ports (Interfaces)
export { type IScheduleTaskApiClient } from './ports/schedule-task-api-client.port';
export { type IScheduleEventApiClient } from './ports/schedule-event-api-client.port';

// HTTP Adapters
export {
  ScheduleTaskHttpAdapter,
  createScheduleTaskHttpAdapter,
} from './adapters/http/schedule-task-http.adapter';
export {
  ScheduleEventHttpAdapter,
  createScheduleEventHttpAdapter,
} from './adapters/http/schedule-event-http.adapter';

// IPC Adapters
export {
  ScheduleTaskIpcAdapter,
  createScheduleTaskIpcAdapter,
} from './adapters/ipc/schedule-task-ipc.adapter';
export {
  ScheduleEventIpcAdapter,
  createScheduleEventIpcAdapter,
} from './adapters/ipc/schedule-event-ipc.adapter';
