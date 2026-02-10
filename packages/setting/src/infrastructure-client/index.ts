/**
 * Setting Module - Infrastructure Client
 *
 * Exports:
 * - Container: SettingContainer
 * - Ports: ISettingApiClient
 * - Adapters: HTTP and IPC implementations
 */

// Container
export { SettingContainer, SettingDependencyKeys } from './setting.container';

// Ports
export type { ISettingApiClient } from './ports';

// Adapters
export { SettingHttpAdapter } from './adapters/http';
export { SettingIpcAdapter } from './adapters/ipc';
