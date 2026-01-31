/**
 * Document Metadata Value Object
 * 文档元数据值对象
 */

// ============ 接口定义 ============

/**
 * 文档元数据 - Server 接口
 */
export interface IDocumentMetadataServer {
  tags: string[];
  category?: string | null;
  wordCount?: number | null;
  characterCount?: number | null;
  readingTime?: number | null; // 秒
  encoding?: string | null;
  language?: string | null;
  customFields?: Record<string, any> | null;

  // 值对象方法
  equals(other: IDocumentMetadataServer): boolean;
  with(
    updates: Partial<
      Omit<
        IDocumentMetadataServer,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): IDocumentMetadataServer;

  // DTO 转换方法}

/**
 * 文档元数据 - Client 接口
 */
export interface IDocumentMetadataClient {
  tags: string[];
  category?: string | null;
  wordCount?: number | null;
  characterCount?: number | null;
  readingTime?: number | null;

  // UI 辅助属性
  wordCountFormatted?: string | null; // "1,234 words"
  readingTimeFormatted?: string | null; // "5 min read"

  // 值对象方法
  equals(other: IDocumentMetadataClient): boolean;

  // DTO 转换方法}

// ============ DTO 定义 ============

/**
 * Document Metadata Server DTO
 */
export interface DocumentMetadataServerDTO {
  tags: string[];
  category?: string | null;
  wordCount?: number | null;
  characterCount?: number | null;
  readingTime?: number | null;
  encoding?: string | null;
  language?: string | null;
  customFields?: Record<string, any> | null;
}

/**
 * Document Metadata Client DTO
 */
export interface DocumentMetadataClientDTO {
  tags: string[];
  category?: string | null;
  wordCount?: number | null;
  characterCount?: number | null;
  readingTime?: number | null;
  wordCountFormatted?: string | null;
  readingTimeFormatted?: string | null;
}

/**
 * Document Metadata Persistence DTO
 */
export interface DocumentMetadataPersistenceDTO {
  tags: string; // JSON.stringify(string[])
  category?: string | null;
  word_count?: number | null;
  character_count?: number | null;
  reading_time?: number | null;
  encoding?: string | null;
  language?: string | null;
  custom_fields?: string | null; // JSON string
}

// ============ 类型导出 ============

export type DocumentMetadataServer = IDocumentMetadataServer;
export type DocumentMetadataClient = IDocumentMetadataClient;
