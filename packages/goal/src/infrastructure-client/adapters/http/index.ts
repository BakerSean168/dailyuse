/**
 * Goal HTTP Adapters - Registration
 *
 * Barrel file for all HTTP-based Goal adapters.
 * Provides factory function to create all HTTP adapters at once.
 */

import type { IResultHttpClient } from '../types';
import { GoalHttpAdapter } from './goal-http.adapter';
import { GoalFolderHttpAdapter } from './goal-folder-http.adapter';

// Re-export adapters
export { GoalHttpAdapter } from './goal-http.adapter';
export { GoalFolderHttpAdapter } from './goal-folder-http.adapter';

/**
 * All HTTP adapters for the Goal module
 */
export interface GoalHttpAdapters {
  goal: GoalHttpAdapter;
  folder: GoalFolderHttpAdapter;
}

/**
 * Create all Goal HTTP adapters from a single IResultHttpClient instance.
 * The concrete implementation (e.g. ResultHttpClient) is created at the App layer.
 *
 * @example
 * ```ts
 * // apps/web/src/infrastructure/goal.ts
 * const httpClient = createResultHttpClient({ baseURL: '/api' });
 * const adapters = createGoalHttpAdapters(httpClient);
 * GoalContainer.getInstance()
 *   .registerApiClient(adapters.goal)
 *   .registerFolderApiClient(adapters.folder);
 * ```
 */
export function createGoalHttpAdapters(
  httpClient: IResultHttpClient,
): GoalHttpAdapters {
  return {
    goal: new GoalHttpAdapter(httpClient),
    folder: new GoalFolderHttpAdapter(httpClient),
  };
}
