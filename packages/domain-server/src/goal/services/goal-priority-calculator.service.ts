/**
 * Goal Priority Calculator Service
 * 目标优先级计算服务
 *
 * 纯函数域服务：根据目标的重要度和目标日期计算优先级分数
 * 
 * 特点：
 * - 纯函数：无副作用，确定性输出
 * - 无依赖注入：独立存在的工具函数
 * - 测试友好：易于单元测试
 * 
 * 算法：
 * Priority = Importance * W1 + (1/TimeRemaining) * W2
 * 其中 W1=0.6, W2=0.4
 */

import type { ImportanceLevel } from '@dailyuse/contracts/shared';
import { PriorityCalculationError } from '../../task/errors/priority-calculation.error';

/**
 * 重要度权重映射
 * 用于将ImportanceLevel转换为基础权重值
 */
const IMPORTANCE_WEIGHTS: Record<ImportanceLevel, number> = {
  vital: 5,
  important: 4,
  moderate: 3,
  minor: 2,
  trivial: 1,
};

/**
 * 优先级级别定义
 */
export type GoalPriorityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

/**
 * 计算目标优先级分数
 * 
 * Goal-specific priority calculation - returns numeric score (0-100)
 * 基于 importance 和 targetDate 的加权公式
 * 
 * @param importance - 目标重要度级别
 * @param targetDate - 目标完成日期（可为null，表示无期限）
 * @param currentTime - 当前时间
 * @returns 优先级分数，范围 [0, 100]
 * 
 * @throws PriorityCalculationError 当输入无效时抛出
 * 
 * @example
 * ```ts
 * // 正常目标：30天后到期的重要目标
 * const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
 * const score = calculateGoalPriority('important', in30Days, new Date());
 * // 返回值 ~50-60
 * 
 * // 无期限目标
 * const score = calculateGoalPriority('moderate', null, new Date());
 * // 返回值在 20-40 之间
 * 
 * // 逾期目标
 * const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
 * const score = calculateGoalPriority('vital', twoDaysAgo, new Date());
 * // 返回值 >= 100（clamped）
 * ```
 */
export function calculateGoalPriority(
  importance: ImportanceLevel | string,
  targetDate: Date | null,
  currentTime: Date,
): number {
  // Input validation
  validateInputs(importance, targetDate, currentTime);

  // Get importance weight (1-5)
  const importanceWeight = IMPORTANCE_WEIGHTS[importance as ImportanceLevel];

  // Handle goals without target date
  if (!targetDate) {
    return calculateNoTargetPriority(importanceWeight);
  }

  // Calculate time factor
  const { daysRemaining, isOverdue } = computeTimeFactor(targetDate, currentTime);

  // Calculate priority using weighted formula
  return calculateWeightedPriority(importanceWeight, daysRemaining, isOverdue);
}

/**
 * 将优先级分数转换为显示级别
 * 
 * @param priority - 优先级分数 (0-100)
 * @returns 优先级级别
 */
export function mapPriorityToLevel(priority: number): GoalPriorityLevel {
  if (priority >= 80) return 'CRITICAL';
  if (priority >= 60) return 'HIGH';
  if (priority >= 40) return 'MEDIUM';
  return 'LOW';
}

/**
 * 将优先级分数转换为显示文本
 * 
 * @param priority - 优先级分数 (0-100)
 * @returns 优先级显示文本
 */
export function mapPriorityToText(priority: number): string {
  const level = mapPriorityToLevel(priority);
  const textMap: Record<GoalPriorityLevel, string> = {
    CRITICAL: '紧急',
    HIGH: '高',
    MEDIUM: '中',
    LOW: '低',
  };
  return textMap[level];
}

/**
 * 验证输入参数的有效性
 * 
 * @throws PriorityCalculationError 当输入无效时抛出
 */
function validateInputs(
  importance: ImportanceLevel | string,
  targetDate: Date | null,
  currentTime: Date,
): void {
  // Validate importance
  const validImportances = ['vital', 'important', 'moderate', 'minor', 'trivial'];
  if (!validImportances.includes(importance as string)) {
    throw new PriorityCalculationError(
      `Invalid importance level: ${importance}. Must be one of: ${validImportances.join(', ')}`,
    );
  }

  // Validate dates
  if (!(currentTime instanceof Date) || isNaN(currentTime.getTime())) {
    throw new PriorityCalculationError('Invalid currentTime: must be a valid Date object');
  }

  if (targetDate && (!(targetDate instanceof Date) || isNaN(targetDate.getTime()))) {
    throw new PriorityCalculationError('Invalid targetDate: must be a valid Date object or null');
  }
}

/**
 * 计算时间因子
 * 提取目标日期和当前时间的差异计算
 * 
 * @returns { daysRemaining, isOverdue }
 */
function computeTimeFactor(
  targetDate: Date,
  currentTime: Date,
): { daysRemaining: number; isOverdue: boolean } {
  const millisecondsDiff = targetDate.getTime() - currentTime.getTime();
  const daysRemaining = millisecondsDiff / (24 * 60 * 60 * 1000);
  
  return {
    daysRemaining,
    isOverdue: daysRemaining < 0,
  };
}

/**
 * 计算无目标日期目标的优先级
 * 无目标日期的目标使用简化公式，只考虑重要性
 * 
 * 公式：importanceWeight * 5 + 5
 * 
 * - Vital: (5 * 5) + 5 = 30
 * - Important: (4 * 5) + 5 = 25
 * - Moderate: (3 * 5) + 5 = 20
 * - Minor: (2 * 5) + 5 = 15
 * - Trivial: (1 * 5) + 5 = 10
 */
function calculateNoTargetPriority(importanceWeight: number): number {
  const baseScore = importanceWeight * 5 + 5;
  return Math.min(100, Math.max(0, baseScore));
}

/**
 * 使用加权公式计算优先级
 * 
 * Priority = Importance*W1 + (1/TimeRemaining)*W2 + OverdueBoost
 * 其中：
 *   - W1 = 0.6 (重要性权重)
 *   - W2 = 0.4 (时间权重)
 *   - Importance权重映射：vital=5, important=4, moderate=3, minor=2, trivial=1
 *   - TimeRemaining：以天为单位
 *   - OverdueBoost: 逾期目标 +50
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
  const importanceScore = importanceWeight * 20;
  const importanceComponent = importanceScore * W1;

  // Time 分量：计算 (1/TimeRemaining) 的影响
  let effectiveDays = Math.max(Math.abs(daysRemaining), 0.01);
  
  if (isOverdue) {
    effectiveDays = Math.max(Math.abs(daysRemaining), 0.5);
  }

  // 目标通常有更长的周期，调整时间系数
  // 使用更平缓的曲线：(30/days) 而不是 (1/days)*100
  const timeScore = (30 / effectiveDays) * 10;
  const timeComponent = timeScore * W2;

  // 计算基础分数
  let score = importanceComponent + timeComponent;

  // 添加逾期加分
  if (isOverdue) {
    score += OVERDUE_BOOST;
  }

  // Clamp 到 [0, 100] 范围
  return Math.min(100, Math.max(0, score));
}
