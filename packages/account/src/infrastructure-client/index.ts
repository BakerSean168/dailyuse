/**
 * Account Infrastructure Client Layer - Barrel Export
 */

// Types (port interfaces + transport interfaces)
export type {
  IHttpClient,
  IIpcClient,
  IAccountApiClient,
} from './adapters/types';

// Adapters
export {
  AccountHttpAdapter,
  createAccountHttpAdapter,
  createAccountHttpAdapters,
  AccountIpcAdapter,
  createAccountIpcAdapter,
  createAccountIpcAdapters,
} from './adapters';
