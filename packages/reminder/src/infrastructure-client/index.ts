/**
 * Reminder Module - Infrastructure Client
 *
 * Adapters for Reminder module communication.
 */

// Port Interfaces
export type {
  IReminderApiClient,
  ReminderTemplatesResponse,
  ReminderGroupsResponse,
  IResultIpcClient,
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
