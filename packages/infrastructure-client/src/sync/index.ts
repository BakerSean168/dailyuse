/**
 * Sync Module
 *
 * 同步模块基础设施层客户端导出
 */

// Container
export { SyncContainer, SyncContainerKeys } from './sync.container';

// Ports
export type { ISyncApiClient } from './ports';

// Adapters
export { SyncIpcAdapter } from './adapters';
