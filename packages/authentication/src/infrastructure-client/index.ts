/**
 * Authentication Infrastructure Client Layer - Barrel Export
 */

// Types (port interfaces + transport interfaces)
export type {
  IResultIpcClient,
  IAuthApiClient,
} from './adapters/types';

// Adapters
export {
  AuthHttpAdapter,
  createAuthHttpAdapter,
  createAuthHttpAdapters,
  AuthIpcAdapter,
  createAuthIpcAdapter,
  createAuthIpcAdapters,
} from './adapters';
