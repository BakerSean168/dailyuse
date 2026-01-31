/**
 * Resource Contracts
 * 资源管理模块契约 - 用于前后端共享类型定义
 */

import { ResourceType } from './value-objects/resource-type';

// Re-export for convenience
export { ResourceType };

// ============================================================
// 资源嵌入模式
// ============================================================

/**
 * 图片嵌入模式
 */
export type ImageEmbedMode = 'link' | 'base64' | 'auto';

// ============================================================
// 资源上传相关
// ============================================================

/**
 * 资源上传结果
 */
export interface ResourceUploadResult {
  uuid: string;
  name: string;
  path: string;
  type: string;
  size: number;
  url: string;
}

/**
 * 资源上传请求
 */
export interface ResourceUploadRequest {
  repositoryUuid: string;
  folderPath?: string;
  /** Base64 编码的文件内容（可选，用于小文件直接上传） */
  base64Content?: string;
}

/**
 * 批量上传结果
 */
export interface BatchUploadResult {
  successful: ResourceUploadResult[];
  failed: Array<{
    filename: string;
    error: string;
  }>;
  total: number;
  successCount: number;
  failCount: number;
}

// ============================================================
// 资源实体
// ============================================================

/**
 * 资源实体（服务端返回）
 */
export interface Resource {
  uuid: string;
  name: string;
  type: ResourceType;
  path: string;
  repositoryUuid: string;
  size: number;
  mimeType: string;
  url: string;
  thumbnailUrl?: string;
  metadata?: ResourceMetadata;
  createdAt: string;
  updatedAt: string;
}

/**
 * 资源元数据
 */
export interface ResourceMetadata {
  /** 图片/视频宽度 */
  width?: number;
  /** 图片/视频高度 */
  height?: number;
  /** 音频/视频时长（秒） */
  duration?: number;
  /** 图片 EXIF 信息 */
  exif?: Record<string, unknown>;
  /** 文件哈希 */
  hash?: string;
}

// ============================================================
// 资源查询
// ============================================================

/**
 * 资源列表查询参数
 */
export interface ResourceListQuery {
  repositoryUuid: string;
  type?: ResourceType | ResourceType[];
  folderPath?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'name' | 'size' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * 资源列表响应
 */
export interface ResourceListResponse {
  resources: Resource[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============================================================
// 资源操作
// ============================================================

/**
 * 资源移动请求
 */
export interface ResourceMoveRequest {
  resourceUuids: string[];
  targetFolderPath: string;
}

/**
 * 资源重命名请求
 */
export interface ResourceRenameRequest {
  uuid: string;
  newName: string;
}

/**
 * 资源删除请求
 */
export interface ResourceDeleteRequest {
  uuids: string[];
  /** 是否永久删除（否则移到回收站） */
  permanent?: boolean;
}

// ============================================================
// 图片处理设置
// ============================================================

/**
 * 图片压缩设置
 */
export interface ImageCompressionSettings {
  /** 是否启用压缩 */
  enabled: boolean;
  /** 压缩质量 (1-100) */
  quality: number;
  /** 最大宽度（0 表示不限制） */
  maxWidth: number;
  /** 是否自动转换为 WebP */
  convertToWebP: boolean;
}

/**
 * 图片嵌入设置
 */
export interface ImageEmbedSettings {
  /** 嵌入模式 */
  mode: ImageEmbedMode;
  /** 自动模式下的大小阈值（KB） */
  autoThresholdKB: number;
  /** 压缩设置 */
  compression: ImageCompressionSettings;
}

// ============================================================
// 资源上传配置常量
// ============================================================

/**
 * 资源上传配置
 * 前后端共享的上传相关常量
 */
export const RESOURCE_UPLOAD_CONFIG = {
  /** 后端并发上传数量限制 */
  SERVER_MAX_CONCURRENT: 5,
  /** 前端并发上传数量限制（浏览器连接数限制） */
  CLIENT_MAX_CONCURRENT: 3,
  /** 单文件最大大小 (50MB) */
  MAX_FILE_SIZE: 50 * 1024 * 1024,
  /** 批量上传最大文件数 */
  MAX_BATCH_FILES: 20,
  /** 上传超时时间 (ms) */
  UPLOAD_TIMEOUT: 60000,
  /** 默认上传目录名 */
  DEFAULT_UPLOAD_DIR: 'uploads',
  /** 资源子目录名 */
  ASSETS_DIR: 'assets',
  /** 允许的 MIME 类型 */
  ALLOWED_MIME_TYPES: [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/flac',
    'video/mp4', 'video/webm', 'video/ogg',
    'application/pdf',
    'text/plain', 'text/markdown',
  ],
} as const;

/** 资源上传配置类型 */
export type ResourceUploadConfig = typeof RESOURCE_UPLOAD_CONFIG;
