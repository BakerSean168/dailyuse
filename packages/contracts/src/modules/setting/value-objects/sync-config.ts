/**
 * SyncConfig Value Object
 * 同步配置值对象
 */

// ============ 值对象接口 ============

/**
 * SyncConfig 值对象接口
 */
export interface SyncConfig {
  enabled: boolean;
  syncToCloud: boolean;
  syncToDevices: boolean;
}


// ============ DTO 定义 ============

/**
 * SyncConfig DTO (Server)
 */
export interface SyncConfigDTO {
  enabled: boolean;
  syncToCloud: boolean;
  syncToDevices: boolean;
}




