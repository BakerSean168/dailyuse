/**
 * Decomposition Responses
 */

/**
 * 分解的任务项
 */
export interface DecomposedTask {
  title: string;
  description: string;
  estimatedMinutes: number;
  complexity: 'simple' | 'medium' | 'complex';
  dependencies: string[];
  suggestedOrder: number;
}

/**
 * 任务分解时间线信息
 */
export interface DecompositionTimeline {
  totalEstimatedHours: number;
  suggestedStartDate?: Date;
  suggestedEndDate?: Date;
  estimatedDays?: number;
}

/**
 * 风险项
 */
export interface RiskItem {
  description: string;
  mitigation: string;
}

/**
 * AI分解结果
 */
export interface DecompositionResult {
  tasks: DecomposedTask[];
  timeline: DecompositionTimeline;
  risks: RiskItem[];
  confidence?: number;
}
