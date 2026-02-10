/**
 * Account Infrastructure Client Layer - Barrel Export
 */

// HTTP Adapter
export { AccountHttpAdapter, createAccountHttpAdapter } from './http/account-http.adapter';
export type { HttpClient } from './http/account-http.adapter';

// IPC Adapter
export { AccountIpcAdapter, createAccountIpcAdapter } from './ipc/account-ipc.adapter';
