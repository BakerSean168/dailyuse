/**
 * Authentication client seam.
 *
 * Public authentication contracts stay centralized in
 * `@dailyuse/contracts/authentication`.
 * Callers depend on this seam instead of the old application-client /
 * infrastructure-client layered exports.
 */

import type { IResultHttpClient } from '@dailyuse/http-client';
import {
  createAuthenticationClientService,
  type AuthenticationClientPort,
} from '../application-client';
import {
  AuthHttpAdapter,
  createAuthHttpAdapters,
  type AuthHttpAdapters,
} from '../infrastructure-client/adapters/http';
import {
  AuthIpcAdapter,
  createAuthIpcAdapters,
  type AuthIpcAdapters,
} from '../infrastructure-client/adapters/ipc';
import type {
  IAuthApiClient,
  IResultIpcClient,
} from '../infrastructure-client/adapters/types';

export type {
  AuthenticationClientPort,
  AuthHttpAdapters,
  AuthIpcAdapters,
  IAuthApiClient,
  IResultHttpClient,
  IResultIpcClient,
};

export function createAuthenticationHttpClient(
  httpClient: IResultHttpClient,
): AuthenticationClientPort {
  return createAuthenticationClientService(new AuthHttpAdapter(httpClient));
}

export function createAuthenticationIpcClient(
  ipcClient: IResultIpcClient,
): AuthenticationClientPort {
  return createAuthenticationClientService(new AuthIpcAdapter(ipcClient));
}

export {
  AuthHttpAdapter,
  AuthIpcAdapter,
  createAuthHttpAdapters,
  createAuthIpcAdapters,
};
