/**
 * Reminder client seam.
 *
 * Public reminder contracts stay centralized in
 * `@dailyuse/contracts/reminder`.
 * Callers depend on this seam instead of the old application-client /
 * infrastructure-client layered exports.
 */

import type { IResultHttpClient } from '@dailyuse/http-client';
import {
  createReminderClientService,
  createReminderServiceFromHttpClient,
  type ReminderClientPort,
} from '../application-client';
import {
  ReminderHttpAdapter,
  createReminderHttpAdapter,
  createReminderHttpAdapters,
  type ReminderHttpAdapters,
} from '../infrastructure-client/adapters/http';
import {
  ReminderIpcAdapter,
  createReminderIpcAdapter,
  createReminderIpcAdapters,
  type ReminderIpcAdapters,
} from '../infrastructure-client/adapters/ipc';
import type { IReminderApiClient, IResultIpcClient } from '../infrastructure-client/adapters/types';

export type {
  IReminderApiClient,
  IResultHttpClient,
  IResultIpcClient,
  ReminderClientPort,
  ReminderHttpAdapters,
  ReminderIpcAdapters,
};

export function createReminderHttpClient(httpClient: IResultHttpClient): ReminderClientPort {
  return createReminderServiceFromHttpClient(httpClient);
}

export function createReminderIpcClient(ipcClient: IResultIpcClient): ReminderClientPort {
  return createReminderClientService(createReminderIpcAdapter(ipcClient));
}

export {
  ReminderHttpAdapter,
  ReminderIpcAdapter,
  createReminderClientService,
  createReminderHttpAdapter,
  createReminderHttpAdapters,
  createReminderIpcAdapter,
  createReminderIpcAdapters,
};
