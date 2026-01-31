/**
 * Knowledge Generation Request DTO
 * Story 4.3: Knowledge Series Generation
 */
export interface KnowledgeGenerationRequest {
  /** 主题 (1-100 chars) */
  topic: string;
  /** 文档数量 (3-7, default 5) */
  documentCount?: number;
  /** 目标受众 (optional) */
  targetAudience?: string;
  /** 文档存储路径 (optional, default: /AI Generated/{topic}) */
  folderPath?: string;
}
