/**
 * Task client seam.
 *
 * Public task contracts stay centralized in
 * `@dailyuse/contracts/task`.
 * Callers depend on this seam instead of the old application-client /
 * infrastructure-client layered exports.
 */

import type { IResultHttpClient } from '@dailyuse/http-client';
import {
  TaskClientService,
  createTaskClientService,
  createTaskServiceFromHttpClient,
  type TaskClientPort,
} from '../application-client';
import {
  buildTaskGraphData,
  TaskGraphEdgeKind,
  taskInstanceToDAG,
  taskInstanceToWidget,
  taskTemplateToDAG,
  type TaskForDAG,
  type TaskForWidget,
  type TaskGraphData,
  type TaskGraphEdge,
} from '../application-client/types/task-dag.types';
import { TaskInstance, TaskTemplate } from '../domain-client';
import {
  TaskDependencyHttpAdapter,
  TaskInstanceHttpAdapter,
  TaskTemplateHttpAdapter,
  createTaskDependencyHttpAdapter,
  createTaskHttpAdapters,
  createTaskInstanceHttpAdapter,
  createTaskTemplateHttpAdapter,
  type TaskHttpAdapters,
} from '../infrastructure-client/adapters/http';
import {
  TaskDependencyIpcAdapter,
  TaskInstanceIpcAdapter,
  TaskTemplateIpcAdapter,
  createTaskDependencyIpcAdapter,
  createTaskIpcAdapters,
  createTaskInstanceIpcAdapter,
  createTaskTemplateIpcAdapter,
  type TaskIpcAdapters,
} from '../infrastructure-client/adapters/ipc';
import type {
  IResultIpcClient,
  ITaskDependencyApiClient,
  ITaskInstanceApiClient,
  ITaskTemplateApiClient,
  TaskTemplateListParams,
} from '../infrastructure-client/adapters/types';

export type {
  IResultHttpClient,
  IResultIpcClient,
  ITaskDependencyApiClient,
  ITaskInstanceApiClient,
  ITaskTemplateApiClient,
  TaskClientPort,
  TaskForDAG,
  TaskForWidget,
  TaskGraphData,
  TaskGraphEdge,
  TaskHttpAdapters,
  TaskIpcAdapters,
  TaskTemplateListParams,
};

export function createTaskHttpClient(httpClient: IResultHttpClient): TaskClientPort {
  return createTaskServiceFromHttpClient(httpClient);
}

export function createTaskIpcClient(ipcClient: IResultIpcClient): TaskClientPort {
  const adapters = createTaskIpcAdapters(ipcClient);
  return createTaskClientService(adapters.template, adapters.instance, adapters.dependency);
}

export {
  TaskClientService,
  TaskDependencyHttpAdapter,
  TaskDependencyIpcAdapter,
  TaskGraphEdgeKind,
  TaskInstance,
  TaskInstanceHttpAdapter,
  TaskInstanceIpcAdapter,
  TaskTemplate,
  TaskTemplateHttpAdapter,
  TaskTemplateIpcAdapter,
  buildTaskGraphData,
  createTaskClientService,
  createTaskDependencyHttpAdapter,
  createTaskDependencyIpcAdapter,
  createTaskHttpAdapters,
  createTaskInstanceHttpAdapter,
  createTaskInstanceIpcAdapter,
  createTaskIpcAdapters,
  createTaskTemplateHttpAdapter,
  createTaskTemplateIpcAdapter,
  taskInstanceToDAG,
  taskInstanceToWidget,
  taskTemplateToDAG,
};
