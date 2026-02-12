import type { IGoalRepository } from '@/domain-server';
import type { GoalClientDTO } from '@dailyuse/contracts/goal';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import { GoalEventPublisher } from './goal-event-publisher';

/**
 * GoalKeyResult 应用服务
 * 负责关键结果的管理
 * 遵循 governance 模块 Result<T> 规范
 *
 * 职责：
 * - 添加关键结果
 * - 更新关键结果配置（标题、权重、目标值等）
 * - 更新关键结果进度
 * - 删除关键结果
 */
export class GoalKeyResultApplicationService {
  constructor(private readonly goalRepository: IGoalRepository) {}

  /**
   * 添加关键结果
   */
  async addKeyResult(
    goalUuid: string,
    keyResult: {
      title: string;
      valueType: string;
      aggregationMethod?: string;
      targetValue: number;
      currentValue?: number;
      unit?: string;
      weight: number;
    },
  ): Promise<Result<GoalClientDTO>> {
    const goal = await this.goalRepository.findById(goalUuid, { includeChildren: true });
    if (!goal) {
      return error('NOT_FOUND', `Goal not found: ${goalUuid}`);
    }

    goal.createAndAddKeyResult(keyResult);
    await this.goalRepository.save(goal);
    await GoalEventPublisher.publishGoalEvents(goal);

    return ok(goal.toClientDTO(true));
  }

  /**
   * 更新关键结果配置（标题、权重等）
   */
  async updateKeyResult(
    goalUuid: string,
    keyResultUuid: string,
    updates: {
      title?: string;
      description?: string;
      weight?: number;
      targetValue?: number;
      unit?: string;
    },
  ): Promise<Result<GoalClientDTO>> {
    const goal = await this.goalRepository.findById(goalUuid, { includeChildren: true });
    if (!goal) {
      return error('NOT_FOUND', `Goal not found: ${goalUuid}`);
    }

    const keyResult = goal.keyResults.find((kr) => kr.id === keyResultUuid);
    if (!keyResult) {
      return error('NOT_FOUND', `KeyResult not found: ${keyResultUuid}`);
    }

    if (updates.title !== undefined) {
      keyResult.updateTitle(updates.title);
    }
    if (updates.description !== undefined) {
      keyResult.updateDescription(updates.description);
    }
    if (updates.weight !== undefined) {
      keyResult.updateWeight(updates.weight);
    }

    await this.goalRepository.save(goal);
    await GoalEventPublisher.publishGoalEvents(goal);

    return ok(goal.toClientDTO(true));
  }

  /**
   * 更新关键结果进度
   */
  async updateKeyResultProgress(
    goalUuid: string,
    keyResultUuid: string,
    currentValue: number,
    note?: string,
  ): Promise<Result<GoalClientDTO>> {
    const goal = await this.goalRepository.findById(goalUuid, { includeChildren: true });
    if (!goal) {
      return error('NOT_FOUND', `Goal not found: ${goalUuid}`);
    }

    goal.updateKeyResultProgress(keyResultUuid, currentValue, note);
    await this.goalRepository.save(goal);
    await GoalEventPublisher.publishGoalEvents(goal);

    return ok(goal.toClientDTO(true));
  }

  /**
   * 删除关键结果
   */
  async deleteKeyResult(goalUuid: string, keyResultUuid: string): Promise<Result<GoalClientDTO>> {
    const goal = await this.goalRepository.findById(goalUuid, { includeChildren: true });
    if (!goal) {
      return error('NOT_FOUND', `Goal not found: ${goalUuid}`);
    }

    goal.removeKeyResult(keyResultUuid);
    await this.goalRepository.save(goal);
    await GoalEventPublisher.publishGoalEvents(goal);

    return ok(goal.toClientDTO(true));
  }
}
