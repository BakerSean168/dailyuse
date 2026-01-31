/**
 * Resource Metadata Value Object - Client
 * 资源元数据值对象 - 客户端
 */
import type { ResourceMetadataServerDTO } from './ResourceMetadataServer';

// ============ Client DTO ============
export interface ResourceMetadataClientDTO {
  wordCount?: number | null;
  readingTime?: number | null;
  thumbnail?: string | null;
  [key: string]: unknown;

  // UI 计算字段
  wordCountText: string; // "1,234 字"
  readingTimeText: string; // "约 5 分钟"
  hasThumbnail: boolean;
}

// ============ Client 接口 ============
export interface ResourceMetadataClient {
  wordCount?: number | null;
  readingTime?: number | null;
  thumbnail?: string | null;
  [key: string]: unknown;

  // UI 计算属性
  wordCountText: string;
  readingTimeText: string;
  hasThumbnail: boolean;}

// ============ Client Static ============
