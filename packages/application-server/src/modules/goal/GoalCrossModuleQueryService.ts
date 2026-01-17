/**
 * 跨模块查询 API - Goal 模块查询接口
 * 为其他模块提供目标和关键结果的查询服务
 */

import type { GoalServerDTO, GoalClientDTO, KeyResultServerDTO } from '@dailyuse/contracts/goal';
import { GoalStatus } from '@dailyuse/contracts/goal';
import type { IGoalRepository } from '@dailyuse/domain-server/goal';

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
  private goalRepository: IGoalRepository;

  public constructor(goalRepository: IGoalRepository) {
    this.goalRepository = goalRepository;
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
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

