/**
 * Goal Module - Infrastructure Client
 *
 * Adapters and container for Goal module communication.
 */

// Container
export { GoalContainer, GoalDependencyKeys, type IGoalRepository } from './goal.container';

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
