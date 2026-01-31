/**
 * SyncConfig Value Object - Client Interface
 * 同步配置值对�?- 客户端接�?
 */

import type { SyncConfigServerDTO } from './sync-config-server';

// ============ DTO 定义 ============

/**
 * SyncConfig Client DTO
 */
export interface SyncConfigClientDTO {
  enabled: boolean;
  syncToCloud: boolean;
  syncToDevices: boolean;
}

// ============ 值对象接�?============

export interface SyncConfigClient {
  enabled: boolean;
  syncToCloud: boolean;
  syncToDevices: boolean;

  // UI 方法
  isSyncEnabled(): boolean;
  getSyncTargets(): string[];
}
}
