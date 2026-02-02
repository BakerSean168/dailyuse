/**
 * Generate Tasks Response
 * 生成任务模板响应DTO
 */

import { AITaskPriority } from '../value-objects/ai-task-priority';
import type { TokenUsageClientDTO } from '../value-objects/token-usage';

/**
 * 任务模板预览
 */
export interface TaskTemplatePreview {
  /** 任务标题（动词开头，如 "Audit...", "Implement..."） */
  title: string;
  /** 任务描述（包含完成标准） */
  description?: string;
  /** 估计工时（1-40小时） */
  estimatedHours: number;
  /** 优先级 */
  priority: AITaskPriority;
  /** 依赖任务的索引数组 */
  dependencies: number[];
  /** 标签 */
  tags?: string[];
}

/**
 * 生成任务模板响应
 */
export interface GenerateTasksResponse {
  /** 生成的任务列表（5-10个） */
  tasks: TaskTemplatePreview[];
  /** Token 使用统计 */
  tokenUsage: TokenUsageClientDTO;
  /** 生成时间戳 */
  generatedAt: number;
}
