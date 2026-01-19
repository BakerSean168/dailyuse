/**
 * Goal Module - Infrastructure Client
 *
 * Ports and Adapters for Goal module communication.
 */

// Container
export {
  GoalContainer,
  GoalDependencyKeys,
  type IGoalRepository,
} from './goal.container';

// Core API Clients (Framework-agnostic)
export { GoalApiClient, GoalFolderApiClient, type IHttpClient } from './goal-api-client';

// Ports (Interfaces)
export { type IGoalApiClient } from './ports/goal-api-client.port';
export { type IGoalFolderApiClient } from './ports/goal-folder-api-client.port';
export { type IGoalFocusApiClient } from './ports/goal-focus-api-client.port';

// HTTP Adapters
export { GoalHttpAdapter, createGoalHttpAdapter } from './adapters/http/goal-http.adapter';
export {
  GoalFolderHttpAdapter,
  createGoalFolderHttpAdapter,
} from './adapters/http/goal-folder-http.adapter';

// IPC Adapters
export { GoalIpcAdapter, createGoalIpcAdapter } from './adapters/ipc/goal-ipc.adapter';
export {
  GoalFolderIpcAdapter,
  createGoalFolderIpcAdapter,
} from './adapters/ipc/goal-folder-ipc.adapter';
export {
  GoalFocusIpcAdapter,
  createGoalFocusIpcAdapter,
} from './adapters/ipc/goal-focus-ipc.adapter';

