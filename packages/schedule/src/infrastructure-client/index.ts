/**
 * Schedule Module - Infrastructure Client
 *
 * Adapters and container for Schedule module communication.
 */

// Container
export {
  ScheduleContainer,
  ScheduleDependencyKeys,
  type IScheduleTaskRepository,
  type IScheduleEventRepository,
} from './schedule.container';

// Port Interfaces
export type {
  IScheduleTaskApiClient,
  IScheduleEventApiClient,
  IIpcClient,
  ScheduleStatisticsClientDTO,
  ModuleStatisticsClientDTO,
} from './adapters/types';

// HTTP Adapters
export {
  ScheduleEventHttpAdapter,
  ScheduleTaskHttpAdapter,
  createScheduleHttpAdapters,
  type ScheduleHttpAdapters,
} from './adapters/http';

// IPC Adapters
export {
  ScheduleEventIpcAdapter,
  ScheduleTaskIpcAdapter,
  createScheduleIpcAdapters,
  type ScheduleIpcAdapters,
} from './adapters/ipc';
