/**
 * Resource Metadata Value Object
 * 资源元数据值对象
 */

// ============ DTO 定义 ============

/**
 * Resource Metadata DTO
 */
export interface ResourceMetadataDTO {
  tags: string[]; // 资源标签
  wordCount: number | null;
  readingTime: number | null; // 分钟
  thumbnail: string | null; // 缩略图 URL
  [key: string]: unknown; // 可扩展字段
}

// ============ 实体接口 ============

/**
 * Resource Metadata 值对象接口
 */
export interface ResourceMetadata {
  tags: string[];
  wordCount: number | null;
  readingTime: number | null;
  thumbnail: string | null;
}
