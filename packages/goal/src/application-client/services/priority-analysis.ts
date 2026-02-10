/**
 * Priority Analysis Service
 * 智能优先级分析 - 计算任务优先级评分和建议
 * @module PriorityAnalysisService
 */

import type {
  TimeEstimationRequest,
  TimeEstimate,
  BatchTimeEstimationResult,
  TimeEstimationHistory,
  UserEstimationPattern,
  EstimationAccuracyAnalysis,
} from '@dailyuse/contracts/goal';

export interface PriorityFactor {
  urgency: number; // 0-10: 基于截止日期
  importance: number; // 0-10: 基于目标关联
  impact: number; // 0-10: 完成后的影响
  effort: number; // 0-10: 所需时间和复杂度
  dependencies: number; // 0-10: 阻塞其他任务数
  momentum: number; // 0-10: 与当前工作连续性
}

export type EisenhowerQuadrant =
  | 'urgent-important'
  | 'not-urgent-important'
  | 'urgent-not-important'
  | 'not-urgent-not-important';

export type PriorityLevel = 'critical' | 'high' | 'medium' | 'low';

export interface PriorityScore {
  taskId: string;
  taskTitle: string;
  score: number; // 0-100
  level: PriorityLevel;
  factors: PriorityFactor;
  eisenhowerQuadrant: EisenhowerQuadrant;
  recommendation: string;
  reasoning: string;
  createdAt: Date;
}

export interface PriorityBatchResult {
  tasks: PriorityScore[];
  totalTasks: number;
  averageScore: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  generatedAt: Date;
}

/**
 * 优先级分析服务 - 单例模式
 */
export class PriorityAnalysisService {
  private static instance: PriorityAnalysisService;
  private cache = new Map<string, { score: PriorityScore; timestamp: Date }>();
  private cacheExpiry = 30 * 60 * 1000; // 30 分钟

  private constructor() {}

  static getInstance(): PriorityAnalysisService {
    if (!this.instance) {
      this.instance = new PriorityAnalysisService();
    }
    return this.instance;
  }

  /**
   * 分析单个任务的优先级
   */
  async analyzePriority(request: {
    taskId: string;
    taskTitle: string;
    description?: string;
    deadline?: Date;
    importance?: 'trivial' | 'minor' | 'moderate' | 'important' | 'vital';
    urgency?: 'none' | 'low' | 'medium' | 'high' | 'critical';
    estimatedMinutes?: number;
    goalId?: string;
    dependencyCount?: number;
    relatedTasksCount?: number;
  }): Promise<PriorityScore> {
    // 检查缓存
    const cacheKey = this.generateCacheKey(request);
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp.getTime() < this.cacheExpiry) {
      return cached.score;
    }

    // 计算各个因子
    const factors = this.calculateFactors(request);

    // 计算综合评分 (加权平均)
    const score = this.calculateWeightedScore(factors);
    const level = this.getLevel(score);

    const result: PriorityScore = {
      taskId: request.taskId,
      taskTitle: request.taskTitle,
      score: Math.round(score),
      level,
      factors,
      eisenhowerQuadrant: this.classifyEisenhower(
        factors.urgency,
        factors.importance
      ),
      recommendation: this.generateRecommendation(factors, level),
      reasoning: this.generateReasoning(factors),
      createdAt: new Date(),
    };

    // 缓存结果
    this.cache.set(cacheKey, { score: result, timestamp: new Date() });

    return result;
  }

  /**
   * 批量分析优先级
   */
  async batchAnalyzePriority(
    requests: Parameters<typeof this.analyzePriority>[0][]
  ): Promise<PriorityBatchResult> {
    const tasks = await Promise.all(requests.map((req) => this.analyzePriority(req)));

    const criticalCount = tasks.filter((t) => t.level === 'critical').length;
    const highCount = tasks.filter((t) => t.level === 'high').length;
    const mediumCount = tasks.filter((t) => t.level === 'medium').length;
    const lowCount = tasks.filter((t) => t.level === 'low').length;

    const averageScore =
      tasks.reduce((sum, t) => sum + t.score, 0) / tasks.length;

    return {
      tasks,
      totalTasks: tasks.length,
      averageScore: Math.round(averageScore),
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      generatedAt: new Date(),
    };
  }

  /**
   * 计算优先级因子
   */
  private calculateFactors(request: {
    taskId: string;
    taskTitle: string;
    description?: string;
    deadline?: Date;
    importance?: string;
    urgency?: string;
    estimatedMinutes?: number;
    goalId?: string;
    dependencyCount?: number;
    relatedTasksCount?: number;
  }): PriorityFactor {
    const urgency = this.calculateUrgency(request.deadline, request.urgency);
    const importance = this.calculateImportance(request.importance, request.goalId);
    const impact = this.calculateImpact(request.goalId, request.relatedTasksCount || 0);
    const effort = this.calculateEffort(request.estimatedMinutes);
    const dependencies = Math.min((request.dependencyCount || 0) * 1.5, 10);
    const momentum = 5; // 默认中等 (实际应用中需要分析上下文)

    return {
      urgency,
      importance,
      impact,
      effort,
      dependencies,
      momentum,
    };
  }

  /**
   * 计算紧急度 (0-10, 基于截止日期)
   */
  private calculateUrgency(deadline?: Date, userUrgency?: string): number {
    let score = 5; // 默认中等

    // 用户标记的紧急度
    if (userUrgency === 'critical') score += 3;
    else if (userUrgency === 'high') score += 2;
    else if (userUrgency === 'medium') score += 1;
    else if (userUrgency === 'low') score -= 2;
    else if (userUrgency === 'none') score -= 3;

    // 基于截止日期
    if (deadline) {
      const now = new Date();
      const daysUntil = Math.ceil(
        (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntil < 0) score = 10; // 已过期
      else if (daysUntil === 0) score += 4; // 今天
      else if (daysUntil === 1) score += 3; // 明天
      else if (daysUntil <= 3) score += 2;
      else if (daysUntil <= 7) score += 1;
    }

    return Math.min(Math.max(score, 0), 10);
  }

  /**
   * 计算重要度 (0-10, 基于用户标记和目标关联)
   */
  private calculateImportance(userImportance?: string, goalId?: string): number {
    let score = 5;

    if (userImportance === 'vital') score += 3;
    else if (userImportance === 'important') score += 2;
    else if (userImportance === 'moderate') score += 1;
    else if (userImportance === 'minor') score -= 2;
    else if (userImportance === 'trivial') score -= 3;

    // 有目标关联时加分
    if (goalId) score += 2;

    return Math.min(Math.max(score, 0), 10);
  }

  /**
   * 计算影响度 (0-10, 基于依赖项和相关任务)
   */
  private calculateImpact(goalId?: string, relatedTasksCount: number = 0): number {
    let score = 5;

    if (relatedTasksCount > 5) score += 3;
    else if (relatedTasksCount > 2) score += 2;
    else if (relatedTasksCount > 0) score += 1;

    if (goalId) score += 1;

    return Math.min(Math.max(score, 0), 10);
  }

  /**
   * 计算努力度 (0-10, 基于预估时间)
   */
  private calculateEffort(estimatedMinutes?: number): number {
    if (!estimatedMinutes) return 5;

    if (estimatedMinutes <= 15) return 2; // 很小
    if (estimatedMinutes <= 30) return 3; // 小
    if (estimatedMinutes <= 60) return 5; // 中
    if (estimatedMinutes <= 120) return 7; // 大
    return 9; // 很大
  }

  /**
   * 计算加权评分
   */
  private calculateWeightedScore(factors: PriorityFactor): number {
    return (
      factors.urgency * 0.25 +
      factors.importance * 0.25 +
      factors.impact * 0.2 +
      (10 - factors.effort) * 0.1 + // 较小努力优先
      factors.dependencies * 0.1 +
      factors.momentum * 0.1
    );
  }

  /**
   * 获取优先级等级
   */
  private getLevel(score: number): PriorityLevel {
    if (score >= 75) return 'critical';
    if (score >= 50) return 'high';
    if (score >= 25) return 'medium';
    return 'low';
  }

  /**
   * 艾森豪威尔矩阵分类
   */
  private classifyEisenhower(urgency: number, importance: number): EisenhowerQuadrant {
    const isUrgent = urgency >= 5;
    const isImportant = importance >= 5;

    if (isUrgent && isImportant) return 'urgent-important';
    if (!isUrgent && isImportant) return 'not-urgent-important';
    if (isUrgent && !isImportant) return 'urgent-not-important';
    return 'not-urgent-not-important';
  }

  /**
   * 生成优先级建议
   */
  private generateRecommendation(factors: PriorityFactor, level: PriorityLevel): string {
    if (level === 'critical') {
      return '立即开始此任务，这是当前最重要的工作';
    } else if (level === 'high') {
      return '今天应该完成此任务';
    } else if (level === 'medium') {
      return '这周应该安排时间完成此任务';
    }
    return '可以安排在周期性复查时再处理';
  }

  /**
   * 生成优先级理由说明
   */
  private generateReasoning(factors: PriorityFactor): string {
    const reasons: string[] = [];

    if (factors.urgency >= 7) reasons.push('截止日期临近');
    if (factors.importance >= 7) reasons.push('重要性高');
    if (factors.impact >= 7) reasons.push('完成后影响大');
    if (factors.dependencies >= 5) reasons.push('阻塞其他工作');
    if (factors.effort <= 3) reasons.push('工作量小');

    if (reasons.length === 0) reasons.push('综合评估');

    return reasons.join('，') || '基于任务特征计算';
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(request: { taskId: string }): string {
    return `priority-${request.taskId}`;
  }

  /**
   * 清空缓存
   */
  clearCache(cacheKey?: string): void {
    if (cacheKey) {
      this.cache.delete(cacheKey);
    } else {
      this.cache.clear();
    }
  }

  /**
   * 设置缓存过期时间
   */
  setCacheExpiry(minutes: number): void {
    this.cacheExpiry = minutes * 60 * 1000;
  }
}

export default PriorityAnalysisService;
