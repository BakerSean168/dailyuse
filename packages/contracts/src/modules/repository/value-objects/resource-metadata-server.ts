/**
 * Resource Metadata Value Object - Server
 * 资源元数据值对�?- 服务�?
 */

// ============ Server DTO ============
export interface ResourceMetadataServerDTO {
  wordCount: number | null;
  readingTime: number | null; // 分钟
  thumbnail: string | null; // 缩略�?URL
  [key: string]: unknown; // 可扩展字�?
}

// ============ Server 接口 ============
export interface ResourceMetadataServer {
  wordCount: number | null;
  readingTime: number | null;
  thumbnail: string | null;
  [key: string]: unknown;
}

// ============ Server Static ============
