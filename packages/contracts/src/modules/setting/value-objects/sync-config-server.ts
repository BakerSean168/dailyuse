/**
 * SyncConfig Value Object - Server Interface
 * 同步配置值对�?- 服务端接�?
 */

import type { SyncConfigClientDTO } from './sync-config-client';

// ============ DTO 定义 ============

/**
 * SyncConfig Server DTO
 */
export interface SyncConfigServerDTO {
  enabled: boolean;
  syncToCloud: boolean;
  syncToDevices: boolean;
}

/**
 * SyncConfig Persistence DTO
 */
export interface SyncConfigPersistenceDTO {
  enabled: boolean;
  syncToCloud: boolean;
  syncToDevices: boolean;
}

// ============ 值对象接�?============

export interface SyncConfigServer {
  enabled: boolean;
  syncToCloud: boolean;
  syncToDevices: boolean;
}

