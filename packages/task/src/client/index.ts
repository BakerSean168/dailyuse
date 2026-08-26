/**
 * Task client seam.
 *
 * Task vNext exposes Action + Execution only. Project-management graph/folder
 * helpers are intentionally absent from this public surface.
 */
import type { IResultHttpClient } from '@memoflow/http-client';
import {
  TaskClientService,
  createTaskClientService,
  createTaskServiceFromHttpClient,
  type TaskClientPort,
} from '../application-client';
import { TaskInstance, TaskTemplate } from '../domain-client';
import {
  TaskInstanceHttpAdapter,
  TaskTemplateHttpAdapter,
  createTaskHttpAdapters,
  createTaskInstanceHttpAdapter,
  createTaskTemplateHttpAdapter,
  type TaskHttpAdapters,
} from '../infrastructure-client/adapters/http';
import {
  TaskInstanceIpcAdapter,
  TaskTemplateIpcAdapter,
  createTaskIpcAdapters,
  createTaskInstanceIpcAdapter,
  createTaskTemplateIpcAdapter,
  type TaskIpcAdapters,
} from '../infrastructure-client/adapters/ipc';
import type {
  IResultIpcClient,
  ITaskInstanceApiClient,
  ITaskTemplateApiClient,
  TaskTemplateListParams,
} from '../infrastructure-client/adapters/types';

export type {
  IResultHttpClient,
  IResultIpcClient,
  ITaskInstanceApiClient,
  ITaskTemplateApiClient,
  TaskClientPort,
  TaskHttpAdapters,
  TaskIpcAdapters,
  TaskTemplateListParams,
};

export function createTaskHttpClient(httpClient: IResultHttpClient): TaskClientPort {
  return createTaskServiceFromHttpClient(httpClient);
}

export function createTaskIpcClient(ipcClient: IResultIpcClient): TaskClientPort {
  const adapters = createTaskIpcAdapters(ipcClient);
  return createTaskClientService(adapters.template, adapters.instance);
}

export {
  TaskClientService,
  TaskInstance,
  TaskInstanceHttpAdapter,
  TaskInstanceIpcAdapter,
  TaskTemplate,
  TaskTemplateHttpAdapter,
  TaskTemplateIpcAdapter,
  createTaskClientService,
  createTaskHttpAdapters,
  createTaskInstanceHttpAdapter,
  createTaskInstanceIpcAdapter,
  createTaskIpcAdapters,
  createTaskTemplateHttpAdapter,
  createTaskTemplateIpcAdapter,
};
