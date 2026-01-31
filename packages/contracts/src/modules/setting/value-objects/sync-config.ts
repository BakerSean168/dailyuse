/**
 * SyncConfig Value Object
 * 同步配置值对象
 */

// ============ DTO 定义 ============

/**
 * SyncConfig DTO (Server)
 */
export interface SyncConfigDTO {
  enabled: boolean;
  syncToCloud: boolean;
  syncToDevices: boolean;
}

/**
 * SyncConfig Client DTO
 */
export interface SyncConfigClientDTO {
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

// ============ 值对象接口 ============

/**
 * SyncConfig 值对象接口
 */
export interface SyncConfig {
  enabled: boolean;
  syncToCloud: boolean;
  syncToDevices: boolean;
}

/**
 * SyncConfig Client 值对象接口
 */
export interface SyncConfigClient {
  enabled: boolean;
  syncToCloud: boolean;
  syncToDevices: boolean;
}

// ============ Backward Compatibility ============

/**
 * @deprecated Use SyncConfigDTO instead
 */
export type SyncConfigServerDTO = SyncConfigDTO;

/**
 * @deprecated Use SyncConfig instead
 */
export type SyncConfigServer = SyncConfig;
