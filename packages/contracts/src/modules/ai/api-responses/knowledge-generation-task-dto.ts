/**
 * Knowledge Generation Task DTO
 * Story 4.3: Async Task Management
 */

export type KnowledgeGenerationTaskStatus = 'PENDING' | 'GENERATING' | 'COMPLETED' | 'FAILED';

export interface GeneratedDocumentPreview {
  /** 文档 ID */
  id?: string;
  /** 文档标题 */
  title: string;
  /** 文档状态 */
  status: 'COMPLETED' | 'FAILED';
  /** 错误信息 (if failed) */
  error?: string;
}

export interface KnowledgeGenerationTaskDTO {
  /** 任务 ID */
  taskId: string;
  /** 主题 */
  topic: string;
  /** 任务状态 */
  status: KnowledgeGenerationTaskStatus;
  /** 进度 (0-100) */
  progress: number;
  /** 已生成的文档预览 */
  generatedDocuments: GeneratedDocumentPreview[];
  /** 预估剩余时间 (ms, optional) */
  estimatedTimeRemaining?: number;
  /** 错误信息 (if failed) */
  error?: string;
  /** 创建时间 */
  createdAt: number;
  /** 完成时间 (if completed) */
  completedAt?: number;
}
