/**
 * Goal Priority Calculator Service
 * 目标优先级计算服务
 *
 * 【架构说明】
 * 这是 domain 层的包装服务，内部使用 domain 的 DailyPriorityCalculator。
 * 
 * 核心算法在 @dailyuse/domain/goal 中实现，确保：
 * - 后端 Domain、Cron Job、前端都使用同一套计算逻辑
 * - 按天精度计算（同一天内分数不变）
 * - 支持持久化到数据库用于高性能排序
 *
 * 【算法公式】
 * Priority = TimeScore (基于日历天数差) + ImportanceScore (重要性加分)
 * 
 * 详细算法请参考 DailyPriorityCalculator 的文档。
 */

import type { ImportanceLevel } from '@dailyuse/contracts/shared';
import {
  DailyPriorityCalculator,
  type PriorityLevel,
  type PriorityCalculationResult,
} from '../priority';

/**
 * 计算目标优先级分数
 * 
 * 使用每日精度的动态优先级算法。
 * 
 * @param importance - 目标重要度级别
 * @param targetDate - 目标完成日期（可为null，表示无期限）
 * @param currentTime - 当前时间（可选，默认为当前时间）
 * @returns 优先级分数
 * 
 * @example
 * ```ts
 * // 今天到期的重要目标
 * const score = calculateGoalPriority('Important', new Date(), new Date());
 * // => 5300 (5000 + 300)
 * 
 * // 已过期2天的紧急目标
 * const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
 * const score = calculateGoalPriority('Vital', twoDaysAgo, new Date());
 * // => 10600 (10000 + 200 + 400)
 * ```
 */
export function calculateGoalPriority(
  importance: ImportanceLevel,
  targetDate: Date | null,
  currentTime: Date = new Date(),
): number {
  return DailyPriorityCalculator.calculate(targetDate, importance, currentTime);
}

/**
 * 计算完整的优先级信息
 * 
 * @param importance - 目标重要度级别
 * @param targetDate - 目标完成日期
 * @param currentTime - 当前时间
 * @returns 完整的优先级计算结果
 */
export function calculateGoalPriorityDetailed(
  importance: ImportanceLevel,
  targetDate: Date | null,
  currentTime: Date = new Date(),
): PriorityCalculationResult {
  return DailyPriorityCalculator.calculateDetailed(targetDate, importance, currentTime);
}

/**
 * 将优先级分数转换为显示级别
 * 
 * @param priority - 优先级分数
 * @returns 优先级级别
 */
export function mapPriorityToLevel(priority: number): PriorityLevel {
  return DailyPriorityCalculator.mapScoreToLevel(priority);
}

/**
 * 将优先级分数转换为显示文本
 * 
 * @param priority - 优先级分数
 * @returns 优先级显示文本
 */
export function mapPriorityToText(priority: number): string {
  return DailyPriorityCalculator.mapScoreToText(priority);
}

/**
 * 比较两个优先级分数（用于排序）
 * 
 * @param a - 分数A
 * @param b - 分数B
 * @returns 比较结果（降序排序）
 */
export function comparePriority(a: number, b: number): number {
  return DailyPriorityCalculator.compare(a, b);
}
