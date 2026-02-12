/**
 * Setting Module - Infrastructure Client
 *
 * Adapters and container for Setting module communication.
 */

// Container
export { SettingContainer, SettingDependencyKeys } from './setting.container';

// Port Interfaces
export type { ISettingApiClient, IHttpClient, IIpcClient } from './adapters/types';

// HTTP Adapters
export { SettingHttpAdapter, createSettingHttpAdapters, type SettingHttpAdapters } from './adapters/http';

// IPC Adapters
export { SettingIpcAdapter, createSettingIpcAdapters, type SettingIpcAdapters } from './adapters/ipc';
