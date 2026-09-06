/**
 * Schedule client seam.
 *
 * Web/Desktop product surfaces use ScheduleProductClientPort: calendar commands
 * plus read-only Scheduler worker diagnostics. The full ScheduleClientPort is
 * retained only for temporary HTTP/Mobile compatibility.
 */

import type { IResultHttpClient } from '@memoflow/http-client';
import {
  createScheduleClientService,
  createScheduleProductClientService,
  createScheduleServiceFromHttpClient,
  type ScheduleClientPort,
  type ScheduleProductClientPort,
} from '../application-client';
import { ScheduleTask } from '../domain-client';
import {
  ScheduleEventHttpAdapter,
  ScheduleTaskHttpAdapter,
  createScheduleHttpAdapters,
  type ScheduleHttpAdapters,
} from '../infrastructure-client/adapters/http';
import {
  ScheduleEventIpcAdapter,
  ScheduleTaskIpcAdapter,
  createScheduleIpcAdapters,
  type ScheduleIpcAdapters,
} from '../infrastructure-client/adapters/ipc';
import type {
  IScheduleEventApiClient,
  IScheduleTaskApiClient,
  IScheduleTaskQueryApiClient,
  IResultIpcClient,
} from '../infrastructure-client/adapters/types';

export type {
  IResultHttpClient,
  IResultIpcClient,
  IScheduleEventApiClient,
  IScheduleTaskApiClient,
  IScheduleTaskQueryApiClient,
  ScheduleClientPort,
  ScheduleProductClientPort,
  ScheduleHttpAdapters,
  ScheduleIpcAdapters,
};

export function createScheduleHttpClient(httpClient: IResultHttpClient): ScheduleClientPort {
  return createScheduleServiceFromHttpClient(httpClient);
}

export function createScheduleIpcClient(ipcClient: IResultIpcClient): ScheduleProductClientPort {
  const adapters = createScheduleIpcAdapters(ipcClient);
  return createScheduleProductClientService(adapters.event, adapters.task);
}

export {
  ScheduleEventHttpAdapter,
  ScheduleEventIpcAdapter,
  ScheduleTask,
  ScheduleTaskHttpAdapter,
  ScheduleTaskIpcAdapter,
  createScheduleClientService,
  createScheduleProductClientService,
  createScheduleHttpAdapters,
  createScheduleIpcAdapters,
};
