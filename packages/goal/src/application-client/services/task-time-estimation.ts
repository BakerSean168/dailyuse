/**
 * 任务时间估算服务
 * @module @dailyuse/goal/application-client/services/task-time-estimation
 */

import { AIServiceFactory } from '../../ai/AIServiceFactory';
import type {
  TimeEstimationRequest,
  TimeEstimate,
  BatchTimeEstimationResult,
} from '@dailyuse/contracts/goal';

/**
 * 任务时间估算服务 - 单例
 * 负责利用 AI 服务为任务提供准确的时间估算
 * 包括缓存机制和历史数据分析
 */
export class TaskTimeEstimationService {
  private static instance: TaskTimeEstimationService;
  private cache = new Map<string, { estimate: TimeEstimate; timestamp: number }>();
  private cacheExpiry = 30 * 60 * 1000; // 默认 30 分钟缓存

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): TaskTimeEstimationService {
    if (!TaskTimeEstimationService.instance) {
      TaskTimeEstimationService.instance = new TaskTimeEstimationService();
    }
    return TaskTimeEstimationService.instance;
  }

  /**
   * 为单个任务估算时间
   * @param request 时间估算请求
   * @returns 时间估算结果
   */
  async estimateTaskTime(request: TimeEstimationRequest): Promise<TimeEstimate> {
    try {
      // 检查缓存
      const cacheKey = this.generateCacheKey(request);
      const cached = this.cache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.estimate;
      }

      // 获取 AI 服务
      const provider = AIServiceFactory.getDefaultProvider();
      if (!provider) {
        throw new Error('No AI provider available');
      }

      // 调用 AI 服务获取估算
      const result = await provider.estimateTaskTime(request.taskDescription);

      // 构建完整的估算结果
      const baseEstimate = result.estimatedMinutes;
      const estimate: TimeEstimate = {
        taskId: request.taskId,
        taskTitle: request.taskTitle,
        estimatedMinutes: baseEstimate,
        confidenceScore: result.confidence,
        reasoning: (result as any).reasoning || '基于 AI 分析',
        adjustedMinutes: this.adjustEstimate(
          baseEstimate,
          request.complexity,
          request.historicalData
        ),
      };

      // 计算调整理由
      if (estimate.adjustedMinutes && estimate.adjustedMinutes !== estimate.estimatedMinutes) {
        const adjustment = (
          ((estimate.adjustedMinutes - estimate.estimatedMinutes) /
            estimate.estimatedMinutes) *
          100
        ).toFixed(1);
        estimate.adjustmentReason = `基于${request.complexity}复杂度和历史数据调整 ${parseFloat(adjustment) > 0 ? '+' : ''}${adjustment}%`;
      }

      // 缓存结果
      this.cache.set(cacheKey, { estimate, timestamp: Date.now() });

      return estimate;
    } catch (error) {
      throw new Error(
        `Failed to estimate task time: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * 批量估算任务时间
   * @param requests 时间估算请求数组
   * @returns 批量估算结果
   */
  async batchEstimateTaskTime(
    requests: TimeEstimationRequest[]
  ): Promise<BatchTimeEstimationResult> {
    try {
      const estimates = await Promise.all(
        requests.map((req) => this.estimateTaskTime(req))
      );

      const totalMinutes = estimates.reduce((sum: number, est: TimeEstimate) => sum + (est.adjustedMinutes || est.estimatedMinutes), 0);
      const averageConfidence =
        estimates.reduce((sum: number, est: TimeEstimate) => sum + est.confidenceScore, 0) / estimates.length;

      return {
        estimates,
        totalMinutes,
        averageConfidence,
        generatedAt: new Date(),
      };
    } catch (error) {
      throw new Error(
        `Failed to batch estimate task times: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * 根据历史数据调整估算时间
   * @param baseEstimate 基础估算时间（分钟）
   * @param complexity 任务复杂度
   * @param historicalData 历史数据
   * @returns 调整后的估算时间
   */
  private adjustEstimate(
    baseEstimate: number,
    complexity?: 'simple' | 'medium' | 'complex',
    historicalData?: any
  ): number {
    if (!historicalData) {
      return baseEstimate;
    }

    let adjustedEstimate = baseEstimate;

    // 基于用户的速度系数调整
    if (historicalData.userSpeedFactor) {
      adjustedEstimate *= historicalData.userSpeedFactor;
    }

    // 基于复杂度和历史数据调整
    if (complexity && historicalData.complexityBias) {
      const bias = historicalData.complexityBias[complexity] || 0;
      adjustedEstimate *= 1 + bias / 100;
    }

    return Math.round(adjustedEstimate);
  }

  /**
   * 清除缓存
   * @param cacheKey 可选的缓存键。如果不提供，清除所有缓存
   */
  clearCache(cacheKey?: string): void {
    if (cacheKey) {
      this.cache.delete(cacheKey);
    } else {
      this.cache.clear();
    }
  }

  /**
   * 设置缓存过期时间（毫秒）
   * @param minutes 分钟数
   */
  setCacheExpiry(minutes: number): void {
    this.cacheExpiry = minutes * 60 * 1000;
  }

  /**
   * 生成缓存键
   * @param request 请求对象
   * @returns 缓存键字符串
   */
  private generateCacheKey(request: TimeEstimationRequest): string {
    return `${request.taskId || request.taskTitle}:${request.complexity || 'default'}`;
  }
}
