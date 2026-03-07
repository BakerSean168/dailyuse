/**
 * Daily Priority Calculator - 每日精度动态优先级计算器
 *
 * 【设计原则】
 * 1. 纯函数：无副作用，确定性输出
 * 2. 共享内核：后端 Domain、Cron Job、前端都可复用
 * 3. 按天计算：同一天内分数不变
 *
 * 【算法公式】
 * Priority = TimeScore (基于日历天数差) + ImportanceScore (重要性加分)
 *
 * 【时间分数 (TimeScore)】
 * | 条件              | 逻辑含义     | 计算公式                    |
 * |-------------------|-------------|----------------------------|
 * | diff < 0          | 已过期       | 10000 + abs(diff) * 100    |
 * | diff == 0         | 今天         | 5000                       |
 * | diff == 1         | 明天         | 2000                       |
 * | 2 <= diff <= 7    | 本周内       | 1000 + (7 - diff) * 100    |
 * | diff > 7          | 未来         | max(0, 500 - diff)         |
 * | targetDate == null| 无期限       | 0                          |
 *
 * 【重要性加分 (ImportanceScore)】
 * - Vital: +400
 * - Important: +300
 * - Moderate: +150
 * - Minor: +50
 * - Trivial: +0
 *
 * @example
 * ```typescript
 * // 今天到期的重要目标
 * const score = DailyPriorityCalculator.calculate(new Date(), 'Important');
 * // => 5000 + 300 = 5300
 *
 * // 已过期2天的紧急目标
 * const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
 * const score = DailyPriorityCalculator.calculate(twoDaysAgo, 'Vital');
 * // => 10000 + 200 + 400 = 10600
 * ```
 */

import type { ImportanceLevel } from '@dailyuse/contracts/shared';

/**
 * 重要性加分映射
 * 用于将 ImportanceLevel 转换为加分值
 */
const IMPORTANCE_SCORES: Record<ImportanceLevel, number> = {
  Vital: 400,
  Important: 300,
  Moderate: 150,
  Minor: 50,
  Trivial: 0,
};

/**
 * 优先级级别定义
 */
export type PriorityLevel = 'Critical' | 'High' | 'Medium' | 'Low';

/**
 * 优先级计算结果
 */
export interface PriorityCalculationResult {
  /** 优先级分数（用于排序） */
  score: number;
  /** 优先级级别（用于显示） */
  level: PriorityLevel;
  /** 优先级显示文本 */
  text: string;
  /** 时间状态 */
  timeStatus: 'Overdue' | 'Today' | 'Tomorrow' | 'ThisWeek' | 'Future' | 'NoDeadline';
  /** 剩余天数（负数表示已过期） */
  daysRemaining: number | null;
}

/**
 * 每日精度动态优先级计算器
 */
export class DailyPriorityCalculator {
  /**
   * 计算优先级分数
   *
   * @param targetDate - 目标完成日期（可为 null 表示无期限）
   * @param importance - 重要性级别
   * @param referenceDate - 参考日期（默认为当前日期，主要用于测试）
   * @returns 优先级分数
   */
  public static calculate(
    targetDate: Date | null,
    importance: ImportanceLevel,
    referenceDate: Date = new Date(),
  ): number {
    const timeScore = this.calculateTimeScore(targetDate, referenceDate);
    const importanceScore = this.getImportanceScore(importance);
    return timeScore + importanceScore;
  }

  /**
   * 计算完整的优先级信息
   *
   * @param targetDate - 目标完成日期
   * @param importance - 重要性级别
   * @param referenceDate - 参考日期
   * @returns 完整的优先级计算结果
   */
  public static calculateDetailed(
    targetDate: Date | null,
    importance: ImportanceLevel,
    referenceDate: Date = new Date(),
  ): PriorityCalculationResult {
    const score = this.calculate(targetDate, importance, referenceDate);
    const daysRemaining = targetDate ? this.getDaysRemaining(targetDate, referenceDate) : null;
    const timeStatus = this.getTimeStatus(daysRemaining);

    return {
      score,
      level: this.mapScoreToLevel(score),
      text: this.mapScoreToText(score),
      timeStatus,
      daysRemaining,
    };
  }

  /**
   * 计算时间分数
   *
   * @param targetDate - 目标日期
   * @param referenceDate - 参考日期
   * @returns 时间分数
   */
  private static calculateTimeScore(targetDate: Date | null, referenceDate: Date): number {
    // 无期限目标
    if (!targetDate) {
      return 0;
    }

    const daysDiff = this.getDaysRemaining(targetDate, referenceDate);

    // 已过期：10000 + abs(diff) * 100
    if (daysDiff < 0) {
      return 10000 + Math.abs(daysDiff) * 100;
    }

    // 今天：5000
    if (daysDiff === 0) {
      return 5000;
    }

    // 明天：2000
    if (daysDiff === 1) {
      return 2000;
    }

    // 本周内 (2-7天)：1000 + (7 - diff) * 100
    if (daysDiff >= 2 && daysDiff <= 7) {
      return 1000 + (7 - daysDiff) * 100;
    }

    // 未来 (>7天)：max(0, 500 - diff)
    return Math.max(0, 500 - daysDiff);
  }

  /**
   * 获取重要性加分
   */
  private static getImportanceScore(importance: ImportanceLevel): number {
    return IMPORTANCE_SCORES[importance] ?? 0;
  }

  /**
   * 计算日历天数差（使用日历日计算，不考虑时分秒）
   *
   * @param targetDate - 目标日期
   * @param referenceDate - 参考日期
   * @returns 日历天数差（正数表示未来，负数表示过去）
   */
  private static getDaysRemaining(targetDate: Date, referenceDate: Date): number {
    // 将日期标准化到当天 00:00:00（使用本地时区）
    const normalizeToDay = (date: Date): Date => {
      const normalized = new Date(date);
      normalized.setHours(0, 0, 0, 0);
      return normalized;
    };

    const targetDay = normalizeToDay(targetDate);
    const referenceDay = normalizeToDay(referenceDate);

    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    return Math.round((targetDay.getTime() - referenceDay.getTime()) / millisecondsPerDay);
  }

  /**
   * 获取时间状态
   */
  private static getTimeStatus(
    daysRemaining: number | null,
  ): PriorityCalculationResult['timeStatus'] {
    if (daysRemaining === null) {
      return 'NoDeadline';
    }
    if (daysRemaining < 0) {
      return 'Overdue';
    }
    if (daysRemaining === 0) {
      return 'Today';
    }
    if (daysRemaining === 1) {
      return 'Tomorrow';
    }
    if (daysRemaining <= 7) {
      return 'ThisWeek';
    }
    return 'Future';
  }

  /**
   * 将分数映射到优先级级别
   *
   * @param score - 优先级分数
   * @returns 优先级级别
   */
  public static mapScoreToLevel(score: number): PriorityLevel {
    // 已过期或今天到期
    if (score >= 5000) {
      return 'Critical';
    }
    // 明天或本周早期
    if (score >= 1500) {
      return 'High';
    }
    // 本周后期
    if (score >= 500) {
      return 'Medium';
    }
    // 未来或无期限
    return 'Low';
  }

  /**
   * 将分数映射到显示文本
   *
   * @param score - 优先级分数
   * @returns 显示文本
   */
  public static mapScoreToText(score: number): string {
    const level = this.mapScoreToLevel(score);
    const textMap: Record<PriorityLevel, string> = {
      Critical: '紧急',
      High: '高',
      Medium: '中',
      Low: '低',
    };
    return textMap[level];
  }

  /**
   * 比较两个优先级分数
   * 用于排序（降序：分数高的在前）
   *
   * @param a - 分数A
   * @param b - 分数B
   * @returns 比较结果（正数表示a应排在b后面）
   */
  public static compare(a: number, b: number): number {
    return b - a; // 降序
  }
}
