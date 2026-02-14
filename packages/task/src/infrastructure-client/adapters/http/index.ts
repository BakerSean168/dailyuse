/**
 * Task HTTP Adapters - Registration
 *
 * Barrel file for all HTTP-based Task adapters.
 * Provides factory function to create all HTTP adapters at once.
 */

import type { IResultHttpClient } from '@dailyuse/http-client';
import { TaskTemplateHttpAdapter } from './task-template-http.adapter';
import { TaskInstanceHttpAdapter } from './task-instance-http.adapter';
import { TaskDependencyHttpAdapter } from './task-dependency-http.adapter';

// Re-export adapters
export { TaskTemplateHttpAdapter } from './task-template-http.adapter';
export { TaskInstanceHttpAdapter } from './task-instance-http.adapter';
export { TaskDependencyHttpAdapter } from './task-dependency-http.adapter';

/**
 * All HTTP adapters for the Task module
 */
export interface TaskHttpAdapters {
  template: TaskTemplateHttpAdapter;
  instance: TaskInstanceHttpAdapter;
  dependency: TaskDependencyHttpAdapter;
}

/**
 * Create all Task HTTP adapters from a single IResultHttpClient instance.
 * The concrete implementation (e.g. ResultHttpClient) is created at the App layer.
 *
 * @example
 * ```ts
 * // apps/web/src/infrastructure/task.ts
 * const httpClient = createResultHttpClient({ baseURL: '/api' });
 * const adapters = createTaskHttpAdapters(httpClient);
 * TaskContainer.getInstance()
 *   .registerTemplateApiClient(adapters.template)
 *   .registerInstanceApiClient(adapters.instance)
 *   .registerDependencyApiClient(adapters.dependency)
 * ```
 */
export function createTaskHttpAdapters(
  httpClient: IResultHttpClient,
): TaskHttpAdapters {
  return {
    template: new TaskTemplateHttpAdapter(httpClient),
    instance: new TaskInstanceHttpAdapter(httpClient),
    dependency: new TaskDependencyHttpAdapter(httpClient),
  };
}
