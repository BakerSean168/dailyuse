/**
 * Goal 跨模块查询服务
 *
 * 为其他模块提供目标和关键结果的查询服务
 * 依赖注入模式：通过构造函数注入 Goal Repository
 */

import type { IGoalRepository } from '@dailyuse/domain-server/goal';
import type { GoalStatus } from '@dailyuse/contracts/goal';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('GoalCrossModuleQueryService');

/**
 * 目标绑定选项（供任务模块使用）
 */
export interface GoalBindingOption {
  uuid: string;
  title: string;
  description?: string | null;
  status: GoalStatus;
  targetDate?: number | null;
  progress?: number;
}

/**
 * 关键结果绑定选项（供任务模块使用）
 */
export interface KeyResultBindingOption {
  uuid: string;
  title: string;
  description?: string | null;
  goalUuid: string;
  progress: {
    current: number;
    target: number;
    percentage: number;
  };
  weight: number;
}

/**
 * Goal 模块跨模块查询服务
 */
export class GoalCrossModuleQueryService {
  private static instance: GoalCrossModuleQueryService | undefined;

  constructor(private readonly goalRepository: IGoalRepository) {}

  /**
   * 获取服务单例
   */
  static getInstance(): GoalCrossModuleQueryService {
    if (!GoalCrossModuleQueryService.instance) {
      throw new Error('GoalCrossModuleQueryService not initialized. Call setInstance() first.');
    }
    return GoalCrossModuleQueryService.instance;
  }

  /**
   * 设置服务单例
   */
  static setInstance(instance: GoalCrossModuleQueryService): void {
    GoalCrossModuleQueryService.instance = instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GoalCrossModuleQueryService.instance = undefined;
  }

  /**
   * 获取可用于任务绑定的目标列表
   * @param accountUuid 账户 UUID
   * @param status 目标状态筛选（默认：进行中、未开始）
   */
  async getGoalsForTaskBinding(params: {
    accountUuid: string;
    status?: GoalStatus[];
  }): Promise<GoalBindingOption[]> {
    // 默认只返回进行中和未开始的目标
    const statusFilter = params.status || ['IN_PROGRESS', 'NOT_STARTED'];

    const goals = await this.goalRepository.findByAccountUuid(params.accountUuid);

    return goals
      .filter((goal: any) => (statusFilter as string[]).includes(goal.status))
      .map((goal: any) => ({
        uuid: goal.uuid,
        title: goal.title,
        description: goal.description,
        status: goal.status,
        targetDate: goal.targetDate,
        progress: goal.getOverallProgress(),
      }));
  }

  /**
   * 获取目标的关键结果列表（用于任务绑定）
   * @param goalUuid 目标 UUID
   */
  async getKeyResultsForTaskBinding(goalUuid: string): Promise<KeyResultBindingOption[]> {
    const goal = await this.goalRepository.findById(goalUuid);
    if (!goal) {
      throw new Error(`Goal not found: ${goalUuid}`);
    }

    const keyResults = goal.keyResults;

    return keyResults.map((kr: any) => ({
      uuid: kr.uuid,
      title: kr.title,
      description: kr.description,
      goalUuid: goal.uuid,
      progress: {
        current: kr.progress.current,
        target: kr.progress.target,
        percentage: kr.progress.progressPercentage,
      },
      weight: kr.weight,
    }));
  }

  /**
   * 验证目标和关键结果的绑定是否有效
   * @param goalUuid 目标 UUID
   * @param keyResultUuid 关键结果 UUID
   */
  async validateGoalBinding(
    goalUuid: string,
    keyResultUuid: string,
  ): Promise<{ valid: boolean; error?: string }> {
    try {
      const goal = await this.goalRepository.findById(goalUuid);
      if (!goal) {
        return { valid: false, error: `Goal not found: ${goalUuid}` };
      }

      const keyResult = goal.keyResults.find((kr: any) => kr.uuid === keyResultUuid);
      if (!keyResult) {
        return { valid: false, error: `KeyResult not found in goal: ${keyResultUuid}` };
      }

      return { valid: true };
    } catch (error) {
      logger.error('Goal binding validation failed', error);
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

/**
 * 便捷函数：获取任务绑定的目标列表
 */
export const getGoalsForTaskBinding = (
  params: Parameters<GoalCrossModuleQueryService['getGoalsForTaskBinding']>[0],
): ReturnType<GoalCrossModuleQueryService['getGoalsForTaskBinding']> =>
  GoalCrossModuleQueryService.getInstance().getGoalsForTaskBinding(params);

/**
 * 便捷函数：获取任务绑定的关键结果列表
 */
export const getKeyResultsForTaskBinding = (
  goalUuid: string,
): ReturnType<GoalCrossModuleQueryService['getKeyResultsForTaskBinding']> =>
  GoalCrossModuleQueryService.getInstance().getKeyResultsForTaskBinding(goalUuid);

/**
 * 便捷函数：验证目标绑定
 */
export const validateGoalBinding = (
  goalUuid: string,
  keyResultUuid: string,
): ReturnType<GoalCrossModuleQueryService['validateGoalBinding']> =>
  GoalCrossModuleQueryService.getInstance().validateGoalBinding(goalUuid, keyResultUuid);
