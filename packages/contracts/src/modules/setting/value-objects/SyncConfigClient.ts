/**
 * SyncConfig Value Object - Client Interface
 * 同步配置值对象 - 客户端接口
 */

import type { SyncConfigServerDTO } from './SyncConfigServer';

// ============ DTO 定义 ============

/**
 * SyncConfig Client DTO
 */
export interface SyncConfigClientDTO {
  enabled: boolean;
  syncToCloud: boolean;
  syncToDevices: boolean;
}

// ============ 值对象接口 ============

export interface SyncConfigClient {
  enabled: boolean;
  syncToCloud: boolean;
  syncToDevices: boolean;

  // UI 方法
  isSyncEnabled(): boolean;
  getSyncTargets(): string[];}
