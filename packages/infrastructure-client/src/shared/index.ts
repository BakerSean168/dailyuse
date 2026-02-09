/**
 * Shared Infrastructure Types
 *
 * Common types and utilities used across all modules.
 */

// HTTP Client Types
export type { HttpClient, IHttpClient, HttpClientConfig } from './http-client.types';

// IPC Client Types
export type { IpcClient, ElectronAPI } from './ipc-client.types';
export { createIpcClient, getElectronAPI, IpcClientError } from './ipc-client.types';

// IPC Result Unwrap Utility
export { unwrapIpcResult } from './ipc-result-unwrap';

// Storage Types
export type { IStorage, ICacheStorage } from './storage';

// Storage Adapters
export { LocalStorageAdapter, MemoryCacheAdapter } from './storage/index';
