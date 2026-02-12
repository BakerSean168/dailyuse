/**
 * Task Decomposition Service - 任务分解应用服务
 * @module @dailyuse/goal/application-client/services
 */

import { AIServiceFactory } from '../../ai/AIServiceFactory';
import type {
  DecomposedTask,
  DecompositionTimeline,
  RiskItem,
  DecompositionResult,
  DecompositionRequest,
  DecompositionOptions,
} from '@dailyuse/contracts/goal';

/**
 * 任务分解服务
 * 负责协调 AI 服务进行目标分解
 */
export class TaskDecompositionService {
  private static instance: TaskDecompositionService;
  private decompositionCache: Map<string, { result: DecompositionResult; timestamp: number }> = new Map();
  private cacheExpiry: number = 3600000; // 1 小时

  private constructor() {}

  /**
   * 获取服务单例
   */
  static getInstance(): TaskDecompositionService {
    if (!TaskDecompositionService.instance) {
      TaskDecompositionService.instance = new TaskDecompositionService();
    }
    return TaskDecompositionService.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    TaskDecompositionService.instance = undefined as unknown as TaskDecompositionService;
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(goalId: string, goalTitle: string): string {
    return `${goalId}:${goalTitle}`;
  }

  /**
   * 检查缓存是否有效
   */
  private isCacheValid(cacheEntry: { result: DecompositionResult; timestamp: number }): boolean {
    return Date.now() - cacheEntry.timestamp < this.cacheExpiry;
  }

  /**
   * 分解目标
   * 
   * @param goalId - 目标ID
   * @param goalTitle - 目标标题
   * @param goalDescription - 目标描述
   * @param options - 分解选项
   * @returns 分解结果
   */
  async decomposeGoal(
    goalId: string,
    goalTitle: string,
    goalDescription: string,
    options?: DecompositionOptions & { goalDeadline?: Date; existingTasks?: Array<{ title: string; id: string }>; userContext?: any }
  ): Promise<DecompositionResult> {
    // 检查缓存
    if (options?.useCache !== false) {
      const cacheKey = this.generateCacheKey(goalId, goalTitle);
      const cachedEntry = this.decompositionCache.get(cacheKey);
      
      if (cachedEntry && this.isCacheValid(cachedEntry)) {
        console.log('[TaskDecompositionService] Using cached decomposition result');
        return cachedEntry.result;
      }
    }

    try {
      // 获取 AI 服务
      const aiService = AIServiceFactory.getDefaultProvider();

      // 构建分解请求
      const request: DecompositionRequest = {
        goalId,
        goalTitle,
        goalDescription,
        goalDeadline: options?.goalDeadline,
        existingTasks: options?.existingTasks,
        userContext: options?.userContext,
      };

      // 执行分解
      const result = await aiService.decomposeGoal(request);

      // 缓存结果
      if (options?.useCache !== false) {
        const cacheKey = this.generateCacheKey(goalId, goalTitle);
        this.decompositionCache.set(cacheKey, {
          result,
          timestamp: Date.now(),
        });
      }

      return result;
    } catch (error) {
      console.error('[TaskDecompositionService] Decomposition failed:', error);
      throw error;
    }
  }

  /**
   * 清空缓存
   */
  clearCache(): void {
    this.decompositionCache.clear();
  }

  /**
   * 设置缓存过期时间
   */
  setCacheExpiry(milliseconds: number): void {
    this.cacheExpiry = milliseconds;
  }
}

/**
 * 便捷函数
 */
export const decomposeGoal = (
  goalId: string,
  goalTitle: string,
  goalDescription: string,
  options?: DecompositionOptions & { goalDeadline?: Date; existingTasks?: Array<{ title: string; id: string }>; userContext?: any }
): Promise<DecompositionResult> =>
  TaskDecompositionService.getInstance().decomposeGoal(goalId, goalTitle, goalDescription, options);
