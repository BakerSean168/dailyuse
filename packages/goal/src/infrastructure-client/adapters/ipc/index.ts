/**
 * Goal IPC Adapters - Registration
 *
 * Barrel file for all IPC-based Goal adapters.
 * Provides factory function to create all IPC adapters at once.
 */

import type { IResultIpcClient } from '../types';
import { GoalIpcAdapter } from './goal-ipc.adapter';
import { GoalFolderIpcAdapter } from './goal-folder-ipc.adapter';
import { GoalFocusIpcAdapter } from './goal-focus-ipc.adapter';

// Re-export adapters
export { GoalIpcAdapter } from './goal-ipc.adapter';
export { GoalFolderIpcAdapter } from './goal-folder-ipc.adapter';
export { GoalFocusIpcAdapter } from './goal-focus-ipc.adapter';

/**
 * All IPC adapters for the Goal module
 */
export interface GoalIpcAdapters {
  goal: GoalIpcAdapter;
  folder: GoalFolderIpcAdapter;
  focus: GoalFocusIpcAdapter;
}

/**
 * Create all Goal IPC adapters from a single IResultIpcClient instance.
 * The concrete implementation (e.g. ResultIpcClient) is created at the App layer.
 *
 * @example
 * ```ts
 * // apps/desktop/src/renderer/modules/goal/infrastructure/ipc/index.ts
 * const ipcClient = createResultIpcClient();
 * const adapters = createGoalIpcAdapters(ipcClient);
 * // register adapters in the app composition root
 * ```
 */
export function createGoalIpcAdapters(ipcClient: IResultIpcClient): GoalIpcAdapters {
  return {
    goal: new GoalIpcAdapter(ipcClient),
    folder: new GoalFolderIpcAdapter(ipcClient),
    focus: new GoalFocusIpcAdapter(ipcClient),
  };
}
