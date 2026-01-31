/**
 * Time Estimation Responses
 */

/**
 * 时间估算结果
 */
export interface TimeEstimate {
  taskId?: string;
  taskTitle: string;
  estimatedMinutes: number;
  confidenceScore: number;
  reasoning: string;
  breakdown?: {
    analysis?: number;
    implementation?: number;
    testing?: number;
    buffer?: number;
  };
  adjustedMinutes?: number;
  adjustmentReason?: string;
}

/**
 * 批量时间估算结果
 */
export interface BatchTimeEstimationResult {
  estimates: TimeEstimate[];
  totalMinutes: number;
  averageConfidence: number;
  generatedAt: Date;
}

/**
 * 时间估算历史记录
 */
export interface TimeEstimationHistory {
  taskId: string;
  taskTitle: string;
  estimatedMinutes: number;
  actualMinutes?: number;
  estimationError?: number;
  complexity: 'simple' | 'medium' | 'complex';
  confidenceScore: number;
  createdAt: Date;
  completedAt?: Date;
}

/**
 * 用户时间估算模式
 */
export interface UserEstimationPattern {
  userId: string;
  totalEstimations: number;
  averageError: number;
  completionSpeedFactor: number;
  complexityBias: {
    simple: number;
    medium: number;
    complex: number;
  };
  accuracyTrend: 'improving' | 'declining' | 'stable';
  lastUpdated: Date;
}

/**
 * 时间估算精准性分析
 */
export interface EstimationAccuracyAnalysis {
  taskId: string;
  estimatedMinutes: number;
  actualMinutes: number;
  error: number;
  possibleCauses: string[];
  recommendations: string[];
  userPattern?: string;
}
