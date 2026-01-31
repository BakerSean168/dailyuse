/**
 * Resource Metadata Value Object - Server
 * 资源元数据值对象 - 服务端
 */

// ============ Server DTO ============
export interface ResourceMetadataServerDTO {
  wordCount?: number | null;
  readingTime?: number | null; // 分钟
  thumbnail?: string | null; // 缩略图 URL
  [key: string]: unknown; // 可扩展字段
}

// ============ Server 接口 ============
export interface ResourceMetadataServer {
  wordCount?: number | null;
  readingTime?: number | null;
  thumbnail?: string | null;
  [key: string]: unknown;}

// ============ Server Static ============
