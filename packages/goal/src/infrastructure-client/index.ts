/**
 * Goal Module - Infrastructure Client
 *
 * Adapters for Goal module communication.
 */

// Port Interfaces
export type {
  IGoalApiClient,
  IGoalFolderApiClient,
  IGoalFocusApiClient,
  IResultHttpClient,
  IResultIpcClient,
} from './adapters/types';

// HTTP Adapters
export {
  GoalHttpAdapter,
  GoalFolderHttpAdapter,
  GoalFocusHttpAdapter,
  createGoalHttpAdapters,
  type GoalHttpAdapters,
} from './adapters/http';

// IPC Adapters
export {
  GoalIpcAdapter,
  GoalFolderIpcAdapter,
  GoalFocusIpcAdapter,
  createGoalIpcAdapters,
  type GoalIpcAdapters,
} from './adapters/ipc';
