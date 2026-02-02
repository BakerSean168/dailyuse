/**
 * Generate Goal Response DTO
 * AI 生成目标响应
 */

import type { TokenUsageClientDTO } from '../value-objects/token-usage';
import type { KeyResultPreview } from './generate-key-results-response';
import type { GoalCategory } from '../api-requests/generate-goal-request';
import { ImportanceLevel } from '../../../shared/value-objects/importance';

/**
 * AI 生成的目标草稿
 */
export interface GeneratedGoalDraft {
  /** 目标标题（简洁有力，20字以内） */
  title: string;

  /** 目标详细描述（100-200字） */
  description: string;

  /** 目标动机（为什么这个目标重要） */
  motivation?: string;

  /** 目标类别 */
  category: GoalCategory;

  /** 建议开始日期时间戳 */
  suggestedStartDate: number;

  /** 建议结束日期时间戳 */
  suggestedEndDate: number;

  /** 重要性级别（枚举值） */
  importance: ImportanceLevel;

  // urgency: UrgencyLevel; // REMOVED - priority now computed from importance + targetDate

  /** 建议标签 */
  tags: string[];

  /** 可行性分析 */
  feasibilityAnalysis?: string;

  /** AI 对目标的理解和建议 */
  aiInsights?: string;
}

/**
 * 生成目标响应
 */
export interface GenerateGoalResponse {
  /** 生成的目标草稿 */
  goal: GeneratedGoalDraft;

  /** Token 使用统计 */
  tokenUsage: TokenUsageClientDTO;

  /** 生成时间戳 */
  generatedAt: number;

  /** 使用的 Provider 名称 */
  providerUsed: string;

  /** 使用的模型 ID */
  modelUsed: string;
}

/**
 * 生成目标 + KRs 响应
 */
export interface GenerateGoalWithKRsResponse {
  /** 生成的目标草稿 */
  goal: GeneratedGoalDraft;

  /** 生成的关键结果预览列表 */
  keyResults: KeyResultPreview[];

  /** Token 使用统计 */
  tokenUsage: TokenUsageClientDTO;

  /** 生成时间戳 */
  generatedAt: number;

  /** 使用的 Provider 名称 */
  providerUsed: string;

  /** 使用的模型 ID */
  modelUsed: string;
}
