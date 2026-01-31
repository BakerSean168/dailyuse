/**
 * Resource Metadata Value Object
 * 资源元数据值对象
 */

// ============ DTO 定义 ============

/**
 * Resource Metadata DTO (Server)
 */
export interface ResourceMetadataDTO {
  wordCount: number | null;
  readingTime: number | null; // 分钟
  thumbnail: string | null; // 缩略图 URL
  [key: string]: unknown; // 可扩展字段
}

/**
 * Resource Metadata Client DTO
 * 包含 UI 计算字段
 */
export interface ResourceMetadataClientDTO {
  wordCount: number | null;
  readingTime: number | null;
  thumbnail: string | null;
  [key: string]: unknown;

  // UI 计算字段
  wordCountText: string; // "1,234 字"
  readingTimeText: string; // "约 5 分钟"
  hasThumbnail: boolean;
}

// ============ 实体接口 ============

/**
 * Resource Metadata 值对象接口
 */
export interface ResourceMetadata {
  wordCount: number | null;
  readingTime: number | null;
  thumbnail: string | null;
  [key: string]: unknown;
}

/**
 * Resource Metadata Client 值对象接口
 * 包含 UI 计算属性
 */
export interface ResourceMetadataClient {
  wordCount: number | null;
  readingTime: number | null;
  thumbnail: string | null;
  [key: string]: unknown;

  // UI 计算属性
  wordCountText: string;
  readingTimeText: string;
  hasThumbnail: boolean;
}

// ============ Backward Compatibility ============

/**
 * @deprecated Use ResourceMetadataDTO instead
 */
export type ResourceMetadataServerDTO = ResourceMetadataDTO;

/**
 * @deprecated Use ResourceMetadata instead
 */
export type ResourceMetadataServer = ResourceMetadata;
