/**
 * Folder Metadata Value Object
 * 文件夹元数据值对象
 */

// ============ DTO 定义 ============

/**
 * Folder Metadata DTO (Server)
 */
export interface FolderMetadataDTO {
  icon?: string;
  color?: string;
  [key: string]: unknown;
}

/**
 * Folder Metadata Client DTO
 * 包含 UI 计算字段
 */
export interface FolderMetadataClientDTO {
  icon?: string;
  color?: string;
  [key: string]: unknown;

  // UI 计算字段
  hasIcon: boolean;
  hasColor: boolean;
  displayIcon: string; // 默认图标或自定义图标
  displayColor: string; // 默认颜色或自定义颜色
}

// ============ 实体接口 ============

/**
 * Folder Metadata 值对象接口
 */
export interface FolderMetadata {
  icon?: string;
  color?: string;
  [key: string]: unknown;
}

/**
 * Folder Metadata Client 值对象接口
 * 包含 UI 计算属性
 */
export interface FolderMetadataClient {
  icon?: string;
  color?: string;
  [key: string]: unknown;

  // UI 计算属性
  hasIcon: boolean;
  hasColor: boolean;
  displayIcon: string;
  displayColor: string;
}

// ============ Backward Compatibility ============

/**
 * @deprecated Use FolderMetadataDTO instead
 */
export type FolderMetadataServerDTO = FolderMetadataDTO;

/**
 * @deprecated Use FolderMetadata instead
 */
export type FolderMetadataServer = FolderMetadata;
