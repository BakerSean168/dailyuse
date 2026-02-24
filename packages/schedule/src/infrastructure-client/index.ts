/**
 * Schedule Module - Infrastructure Client
 *
 * Adapters for Schedule module communication.
 */

// Port Interfaces
export type {
  IScheduleTaskApiClient,
  IScheduleEventApiClient,
  IIpcClient,
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
