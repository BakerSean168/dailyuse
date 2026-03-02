/**
 * Task Priority Calculator Service
 * 任务优先级计算服务
 *
 * 纯函数域服务：根据任务的重要度和截止日期计算优先级分数
 *
 * 特点：
 * - 纯函数：无副作用，确定性输出
 * - 无依赖注入：独立存在的工具函数
 * - 测试友好：易于单元测试
 *
 * 算法框架（Story 1.3 将完善）：
 * Priority = Importance * W1 + (1/TimeRemaining) * W2
 * 其中 W1=0.6, W2=0.4（Story 1.3 定义）
 */

import type { ImportanceLevel } from '@dailyuse/contracts/shared';
import { PriorityCalculationError } from '../errors/priority-calculation.error';

/**
 * 重要度权重映射
 * 用于将ImportanceLevel转换为基础权重值
 */
const IMPORTANCE_WEIGHTS: Record<ImportanceLevel, number> = {
  Vital: 5,
  Important: 4,
  Moderate: 3,
  Minor: 2,
  Trivial: 1,
};

/**
 * 计算任务优先级分数
 *
 * Story 1.3: 基于Importance和TimeRemaining的加权公式
 * Priority = Importance*W1 + (1/TimeRemaining)*W2
 * 其中 W1=0.6 (重要性权重), W2=0.4 (时间权重)
 *
 * Task-specific priority calculation - returns simple numeric score (0-100)
 * Do not confuse with schedule/calculators/priority-calculator which is for Goals/Reminders
 *
 * @param importance - 任务重要度级别
 * @param dueDate - 截止日期（可为null，表示无期限的backlog任务）
 * @param currentTime - 当前时间
 * @returns 优先级分数，范围 [0, 100]
 *
 * @throws PriorityCalculationError 当输入无效时抛出
 *
 * @example
 * ```ts
 * // 正常任务：明天到期的重要任务
 * const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
 * const score = calculateTaskPriority('important', tomorrow, new Date());
 * // 返回值 > 70
 *
 * // Backlog 任务：无期限
 * const score = calculateTaskPriority('moderate', null, new Date());
 * // 返回值在 20-40 之间
 *
 * // 逾期任务：已过期2天
 * const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
 * const score = calculateTaskPriority('vital', twoDaysAgo, new Date());
 * // 返回值 >= 100（clamped）
 * ```
 */
export function calculateTaskPriority(
  importance: ImportanceLevel | string,
  dueDate: Date | null,
  currentTime: Date,
): number {
  // Input validation
  validateInputs(importance, dueDate, currentTime);

  // Get importance weight (1-5)
  const importanceWeight = IMPORTANCE_WEIGHTS[importance as ImportanceLevel];

  // Handle backlog tasks (null dueDate)
  if (!dueDate) {
    return calculateBacklogPriority(importanceWeight);
  }

  // Calculate time factor
  const { daysRemaining, isOverdue } = computeTimeFactor(dueDate, currentTime);

  // Calculate priority using weighted formula
  return calculateWeightedPriority(importanceWeight, daysRemaining, isOverdue);
}

/**
 * 验证输入参数的有效性
 *
 * @throws PriorityCalculationError 当输入无效时抛出
 */
function validateInputs(
  importance: ImportanceLevel | string,
  dueDate: Date | null,
  currentTime: Date,
): void {
  // Validate importance
  const validImportances = ['Vital', 'Important', 'Moderate', 'Minor', 'Trivial'];
  if (!validImportances.includes(importance as string)) {
    throw new PriorityCalculationError(
      `Invalid importance level: ${importance}. Must be one of: ${validImportances.join(', ')}`,
    );
  }

  // Validate dates
  if (!(currentTime instanceof Date) || isNaN(currentTime.getTime())) {
    throw new PriorityCalculationError('Invalid currentTime: must be a valid Date object');
  }

  if (dueDate && (!(dueDate instanceof Date) || isNaN(dueDate.getTime()))) {
    throw new PriorityCalculationError('Invalid dueDate: must be a valid Date object or null');
  }
}

/**
 * 计算时间因子
 * 提取截止日期和当前时间的差异计算
 *
 * @returns { daysRemaining, isOverdue }
 *   - daysRemaining: 剩余天数（正数表示未来，负数表示逾期）
 *   - isOverdue: 是否逾期
 */
function computeTimeFactor(
  dueDate: Date,
  currentTime: Date,
): { daysRemaining: number; isOverdue: boolean } {
  const millisecondsDiff = dueDate.getTime() - currentTime.getTime();
  const daysRemaining = millisecondsDiff / (24 * 60 * 60 * 1000);

  return {
    daysRemaining,
    isOverdue: daysRemaining < 0,
  };
}

/**
 * 计算 Backlog 任务的优先级
 * Backlog 任务（无截止期限）使用简化公式，只考虑重要性
 *
 * 公式：importanceWeight * 5 + 5
 * Story 1.3 中 Backlog 视为 TimeRemaining = 999999
 * 时间项贡献：(1/999999)*0.4*100 ≈ 0.00004，近似 0
 * 所以主要由重要性权重决定
 *
 * - Vital backlog: (5 * 5) + 5 = 30
 * - Important backlog: (4 * 5) + 5 = 25
 * - Moderate backlog: (3 * 5) + 5 = 20
 * - Minor backlog: (2 * 5) + 5 = 15
 * - Trivial backlog: (1 * 5) + 5 = 10
 */
function calculateBacklogPriority(importanceWeight: number): number {
  // Base calculation: importance only (time component negligible for backlog)
  const baseScore = importanceWeight * 5 + 5;
  // Ensure within range
  return Math.min(100, Math.max(0, baseScore));
}

/**
 * 使用加权公式计算优先级
 *
 * Story 1.3 算法：
 * Priority = Importance*W1 + (1/TimeRemaining)*W2 + OverdueBoost
 * 其中：
 *   - W1 = 0.6 (重要性权重)
 *   - W2 = 0.4 (时间权重)
 *   - Importance权重映射：vital=5, important=4, moderate=3, minor=2, trivial=1
 *   - TimeRemaining：以天为单位，取 max(ms/86400000, 0.01) 避免除以0
 *   - OverdueBoost: 逾期任务 +50
 *
 * @param importanceWeight - 重要性权重（1-5）
 * @param daysRemaining - 剩余天数（可为负表示逾期）
 * @param isOverdue - 是否逾期
 * @returns 优先级分数，范围 [0, 100]
 */
function calculateWeightedPriority(
  importanceWeight: number,
  daysRemaining: number,
  isOverdue: boolean,
): number {
  const W1 = 0.6; // 重要性权重
  const W2 = 0.4; // 时间权重
  const OVERDUE_BOOST = 50; // 逾期加分

  // Importance 分量：权重映射到 0-100 范围
  // 重要性权重 (1-5) 乘以 20 得到 20-100 范围
  const importanceScore = importanceWeight * 20;
  const importanceComponent = importanceScore * W1; // 贡献最多 60 分

  // Time 分量：计算 (1/TimeRemaining) 的影响
  // 使用 max(daysRemaining, 0.01) 避免除以 0 或负数导致的异常
  let effectiveDays = Math.max(Math.abs(daysRemaining), 0.01);

  // 如果是负数（逾期），调整以增加时间压力
  // 使用小的数值如 0.5 来增加时间项贡献
  if (isOverdue) {
    effectiveDays = Math.max(Math.abs(daysRemaining), 0.5);
  }

  // 时间反函数：天数越少，贡献越大
  // (1/days)*100 映射时间紧急性
  // 1天：100分  0.5天：200分（会被clamp）  0.01天：10000分（会被clamp）
  const timeScore = (1 / effectiveDays) * 100;
  const timeComponent = timeScore * W2; // 贡献最多 40 分

  // 计算基础分数
  let score = importanceComponent + timeComponent;

  // 添加逾期加分
  if (isOverdue) {
    score += OVERDUE_BOOST;
  }

  // Clamp 到 [0, 100] 范围
  return Math.min(100, Math.max(0, score));
}
