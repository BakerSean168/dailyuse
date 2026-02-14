/**
 * Reminder Module - Infrastructure Client
 *
 * Adapters and container for Reminder module communication.
 */

// Container
export {
  ReminderContainer,
  ReminderDependencyKeys,
  type IReminderRepository,
} from './reminder.container';

// Port Interfaces
export type {
  IReminderApiClient,
  ReminderTemplatesResponse,
  ReminderGroupsResponse,
  IIpcClient,
} from './adapters/types';

// HTTP Adapters
export {
  ReminderHttpAdapter,
  createReminderHttpAdapters,
  type ReminderHttpAdapters,
} from './adapters/http';

// IPC Adapters
export {
  ReminderIpcAdapter,
  createReminderIpcAdapters,
  type ReminderIpcAdapters,
} from './adapters/ipc';
