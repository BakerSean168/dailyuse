/**
 * Folder Metadata Value Object - Client
 * 文件夹元数据值对�?- 客户�?
 */
import type { FolderMetadataServerDTO } from './folder-metadata-server';

// ============ Client DTO ============
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

// ============ Client 接口 ============
export interface FolderMetadataClient {
  icon?: string;
  color?: string;
  [key: string]: unknown;

  // UI 计算属�?
  hasIcon: boolean;
  hasColor: boolean;
  displayIcon: string;
  displayColor: string;
}

// ============ Client Static ============
