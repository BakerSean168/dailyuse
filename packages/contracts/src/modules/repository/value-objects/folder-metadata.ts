/**
 * Folder Metadata Value Object
 * 文件夹元数据值对象
 */

// ============ DTO 定义 ============

/**
 * Folder Metadata DTO
 */
export interface FolderMetadataDTO {
  icon?: string;
  color?: string;
  [key: string]: unknown;
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
