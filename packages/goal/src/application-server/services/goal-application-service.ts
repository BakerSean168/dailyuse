/**
 * @file GoalApplicationService.ts
 * @description 目标应用服务，处理目标的 CRUD 和基本状态管理。
 * 遵循 governance 模块 Result<T> 规范
 * @date 2025-01-22
 */

import type { IGoalRepository } from '@/domain-server';
import { Goal } from '@/domain-server';
import type { GoalClientDTO } from '@dailyuse/contracts/goal';
import type { ImportanceLevel } from '@dailyuse/contracts/shared';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import { IdentityId } from '@dailyuse/domain-shared';
import { GoalEventPublisher } from './goal-event-publisher';

/**
 * 目标应用服务。
 *
 * @remarks
 * 负责目标（Goal）的生命周期管理，包括：
 * - 创建、查询、更新、删除目标。
 * - 归档、激活、完成目标。
 * - 协调 Repository。
 * - 发布相关领域事件。
 */
export class GoalApplicationService {
  constructor(private readonly goalRepository: IGoalRepository) {}

  // ===== Goal CRUD 操作 =====

  /**
   * 创建目标。
   */
  async createGoal(params: {
    accountUuid: string;
    title: string;
    description?: string;
    importance: ImportanceLevel;
    parentGoalUuid?: string;
    folderUuid?: string;
    startDate?: number;
    targetDate?: number;
    tags?: string[];
    metadata?: any;
    color?: string;
    feasibilityAnalysis?: string;
    motivation?: string;
    keyResults?: Array<{
      title: string;
      description?: string;
      valueType?: string;
      aggregationMethod?: string;
      targetValue?: number;
      unit?: string;
      weight?: number;
    }>;
  }): Promise<Result<GoalClientDTO>> {
    // 1. 如果有父目标，先查询
    let parentGoal: Goal | undefined;
    if (params.parentGoalUuid) {
      const found = await this.goalRepository.findById(params.parentGoalUuid);
      if (!found) {
        return error('NOT_FOUND', `Parent goal not found: ${params.parentGoalUuid}`);
      }
      parentGoal = found;
    }

    // 2. 直接使用聚合根工厂方法创建
    const goal = Goal.create(
      {
        identityId: IdentityId.of(params.accountUuid),
        name: params.title,
        description: params.description ?? null,
        color: params.color ?? '#3B82F6',
        feasibilityAnalysis: params.feasibilityAnalysis ?? null,
        motivation: params.motivation ?? null,
        importance: params.importance ?? ('MEDIUM' as ImportanceLevel),
        category: null,
        tags: params.tags ?? [],
        startDate: params.startDate ? new Date(params.startDate) : null,
        targetDate: params.targetDate ? new Date(params.targetDate) : null,
        folderId: params.folderUuid ? (params.folderUuid as any) : null,
        parentGoalId: params.parentGoalUuid ? (params.parentGoalUuid as any) : null,
        reminderConfig: null,
      },
      parentGoal,
    );

    // 3. 如果有 keyResults，添加到目标中
    if (params.keyResults && params.keyResults.length > 0) {
      for (const krParams of params.keyResults) {
        goal.createAndAddKeyResult({
          title: krParams.title,
          description: krParams.description,
          valueType: krParams.valueType || 'Incremental',
          aggregationMethod: krParams.aggregationMethod || 'Last',
          targetValue: krParams.targetValue ?? 100,
          unit: krParams.unit,
          weight: krParams.weight ?? 5,
        });
      }
    }

    // 4. 持久化
    await this.goalRepository.save(goal);

    // 5. 发布领域事件
    await GoalEventPublisher.publishGoalEvents(goal);

    // 6. 返回 Result
    return ok(goal.toClientDTO(true));
  }

  /**
   * 获取目标详情。
   */
  async getGoal(
    uuid: string,
    options?: { includeChildren?: boolean },
  ): Promise<Result<GoalClientDTO>> {
    const goal = await this.goalRepository.findById(uuid, options);
    if (!goal) {
      return error('NOT_FOUND', `Goal not found: ${uuid}`);
    }
    return ok(goal.toClientDTO(true));
  }

  /**
   * 获取用户的所有目标。
   */
  async getUserGoals(
    accountUuid: string,
    options?: {
      includeChildren?: boolean;
      status?: string;
      folderUuid?: string;
    },
  ): Promise<Result<GoalClientDTO[]>> {
    const goals = await this.goalRepository.findByIdentityId(accountUuid, options);
    return ok(goals.map((g: Goal) => g.toClientDTO(true)));
  }

  /**
   * 更新目标基本信息。
   */
  async updateGoal(
    uuid: string,
    updates: Partial<{
      title: string;
      description: string;
      importance: ImportanceLevel;
      category: string;
      deadline: number;
      tags: string[];
      metadata: any;
      color: string;
      feasibilityAnalysis: string;
      motivation: string;
    }>,
  ): Promise<Result<GoalClientDTO>> {
    const goal = await this.goalRepository.findById(uuid, { includeChildren: true });
    if (!goal) {
      return error('NOT_FOUND', `Goal not found: ${uuid}`);
    }

    goal.updateBasicInfo({
      name: updates.title,
      description: updates.description,
      importance: updates.importance,
      category: updates.category,
      color: updates.color,
      feasibilityAnalysis: updates.feasibilityAnalysis,
      motivation: updates.motivation,
    });

    if (updates.tags !== undefined) {
      goal.updateTags(updates.tags);
    }

    await this.goalRepository.save(goal);
    await GoalEventPublisher.publishGoalEvents(goal);

    return ok(goal.toClientDTO(true));
  }

  /**
   * 检查目标关联依赖（删除前检查）。
   */
  async checkGoalDependencies(uuid: string): Promise<Result<{
    hasKeyResults: boolean;
    keyResultCount: number;
    hasReviews: boolean;
    reviewCount: number;
    hasTaskLinks: boolean;
    canDelete: boolean;
    warnings: string[];
  }>> {
    const goal = await this.goalRepository.findById(uuid, { includeChildren: true });
    if (!goal) {
      return error('NOT_FOUND', `Goal not found: ${uuid}`);
    }

    const keyResults = goal.keyResults || [];
    const reviews = goal.goalReviews || [];
    const keyResultCount = keyResults.length;
    const reviewCount = reviews.length;

    const warnings: string[] = [];

    if (keyResultCount > 0) {
      warnings.push(`该目标包含 ${keyResultCount} 个关键结果`);
    }

    if (reviewCount > 0) {
      warnings.push(`该目标包含 ${reviewCount} 条复盘记录`);
    }

    return ok({
      hasKeyResults: keyResultCount > 0,
      keyResultCount,
      hasReviews: reviewCount > 0,
      reviewCount,
      hasTaskLinks: false,
      canDelete: true,
      warnings,
    });
  }

  /**
   * 删除目标（软删除）。
   */
  async deleteGoal(uuid: string): Promise<Result<void>> {
    const goal = await this.goalRepository.findById(uuid, { includeChildren: true });
    if (!goal) {
      return error('NOT_FOUND', `Goal not found: ${uuid}`);
    }

    goal.softDelete();
    await this.goalRepository.save(goal);
    await GoalEventPublisher.publishGoalEvents(goal);

    return ok(undefined as void);
  }

  /**
   * 归档目标。
   */
  async archiveGoal(uuid: string): Promise<Result<GoalClientDTO>> {
    const goal = await this.goalRepository.findById(uuid);
    if (!goal) {
      return error('NOT_FOUND', `Goal not found: ${uuid}`);
    }

    goal.archive();
    await this.goalRepository.save(goal);
    await GoalEventPublisher.publishGoalEvents(goal);

    return ok(goal.toClientDTO());
  }

  /**
   * 激活目标。
   */
  async activateGoal(uuid: string): Promise<Result<GoalClientDTO>> {
    const goal = await this.goalRepository.findById(uuid);
    if (!goal) {
      return error('NOT_FOUND', `Goal not found: ${uuid}`);
    }

    goal.activate();
    await this.goalRepository.save(goal);
    await GoalEventPublisher.publishGoalEvents(goal);

    return ok(goal.toClientDTO());
  }

  /**
   * 完成目标。
   */
  async completeGoal(uuid: string): Promise<Result<GoalClientDTO>> {
    const goal = await this.goalRepository.findById(uuid);
    if (!goal) {
      return error('NOT_FOUND', `Goal not found: ${uuid}`);
    }

    goal.markAsCompleted();
    await this.goalRepository.save(goal);
    await GoalEventPublisher.publishGoalEvents(goal);

    return ok(goal.toClientDTO());
  }

  // ===== 查询操作 =====

  /**
   * 搜索目标。
   */
  async searchGoals(accountUuid: string, query: string): Promise<Result<GoalClientDTO[]>> {
    const goals = await this.goalRepository.findByIdentityId(accountUuid, {});
    return ok(
      goals
        .filter((g) => g.name.includes(query) || g.description?.includes(query))
        .map((g: Goal) => g.toClientDTO()),
    );
  }
}
