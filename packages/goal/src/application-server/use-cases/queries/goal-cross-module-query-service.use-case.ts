/**
 * Goal 跨模块查询服务
 *
 * 为其他模块提供目标和关键结果的查询服务
 * 依赖注入模式：通过构造函数注入 Goal Repository
 */

import type { IGoalRepository } from '@/domain-server';
import type { GoalStatus } from '@dailyuse/contracts/goal';
import { createLogger } from '@dailyuse/utils/logger';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';

const logger = createLogger('GoalCrossModuleQueryService');

/**
 * 目标绑定选项（供任务模块使用）
 */
export interface GoalBindingOption {
  id: string;
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
  id: string;
  title: string;
  description?: string | null;
  goalId: string;
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
export class GoalCrossModuleQueryServiceUseCase {
  constructor(private readonly goalRepository: IGoalRepository) {}

  /**
   * 获取可用于任务绑定的目标列表
   * @param identityId 账户 ID
   * @param status 目标状态筛选（默认：进行中、未开始）
   */
  async getGoalsForTaskBinding(params: {
    identityId: string;
    status?: GoalStatus[];
  }): Promise<Result<GoalBindingOption[]>> {
    // 默认只返回进行中和未开始的目标
    const statusFilter = params.status || ['IN_PROGRESS', 'NOT_STARTED'];

    const goals = await this.goalRepository.findByIdentityId(params.identityId);

    return ok(
      goals
        .filter((goal: any) => (statusFilter as string[]).includes(goal.status))
        .map((goal: any) => ({
          id: goal.id,
          title: goal.title,
          description: goal.description,
          status: goal.status,
          targetDate: goal.targetDate,
          progress: goal.getOverallProgress(),
        })),
    );
  }

  /**
   * 获取目标的关键结果列表（用于任务绑定）
   * @param goalId 目标 UUID
   */
  async getKeyResultsForTaskBinding(goalId: string): Promise<Result<KeyResultBindingOption[]>> {
    const goal = await this.goalRepository.findById(goalId);
    if (!goal) {
      return error('NOT_FOUND', `Goal not found: ${goalId}`);
    }

    const keyResults = goal.keyResults;

    return ok(
      keyResults.map((kr: any) => ({
        id: kr.id,
        title: kr.title,
        description: kr.description,
        goalId: goal.id,
        progress: {
          current: kr.progress.current,
          target: kr.progress.target,
          percentage: kr.progress.progressPercentage,
        },
        weight: kr.weight,
      })),
    );
  }

  /**
   * 验证目标和关键结果的绑定是否有效
   * @param goalId 目标 UUID
   * @param keyResultId 关键结果 UUID
   */
  async validateGoalBinding(
    goalId: string,
    keyResultId: string,
  ): Promise<{ valid: boolean; error?: string }> {
    try {
      const goal = await this.goalRepository.findById(goalId);
      if (!goal) {
        return { valid: false, error: `Goal not found: ${goalId}` };
      }

      const keyResult = goal.keyResults.find((kr: any) => kr.id === keyResultId);
      if (!keyResult) {
        return { valid: false, error: `KeyResult not found in goal: ${keyResultId}` };
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
