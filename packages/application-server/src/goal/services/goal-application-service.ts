/**
 * @file GoalApplicationService.ts
 * @description 目标应用服务，处理目标的 CRUD 和基本状态管理。
 * @date 2025-01-22
 */

import type { IGoalRepository } from '@dailyuse/domain-server/goal';
import { GoalDomainService, Goal } from '@dailyuse/domain-server/goal';
import type { GoalClientDTO } from '@dailyuse/contracts/goal';
import { ImportanceLevel, UrgencyLevel } from '@dailyuse/contracts/shared';
import { GoalEventPublisher } from './goal-event-publisher';

/**
 * 目标应用服务。
 *
 * @remarks
 * 负责目标（Goal）的生命周期管理，包括：
 * - 创建、查询、更新、删除目标。
 * - 归档、激活、完成目标。
 * - 协调 DomainService 和 Repository。
 * - 发布相关领域事件。
 */
export class GoalApplicationService {
  private domainService: GoalDomainService;

  constructor(private readonly goalRepository: IGoalRepository) {
    this.domainService = new GoalDomainService();
  }

  // ===== Goal CRUD 操作 =====

  /**
   * 创建目标。
   */
  async createGoal(params: {
    accountUuid: string;
    title: string;
    description?: string;
    importance: ImportanceLevel;
    urgency: UrgencyLevel;
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
      targetValue?: number;
      unit?: string;
      weight?: number;
    }>;
  }): Promise<GoalClientDTO> {
    // 1. 如果有父目标，先查询
    let parentGoal: Goal | undefined;
    if (params.parentGoalUuid) {
      const found = await this.goalRepository.findById(params.parentGoalUuid);
      if (!found) {
        throw new Error(`Parent goal not found: ${params.parentGoalUuid}`);
      }
      parentGoal = found;
    }

    // 2. 委托领域服务创建聚合根（不持久化）
    const goal = this.domainService.createGoal(params, parentGoal);

    // 3. 如果有 keyResults，添加到目标中
    if (params.keyResults && params.keyResults.length > 0) {
      for (const krParams of params.keyResults) {
        this.domainService.addKeyResultToGoal(goal, {
          title: krParams.title,
          description: krParams.description,
          valueType: krParams.valueType || 'INCREMENTAL',
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

    // 6. 返回 ClientDTO（包含 keyResults）
    return goal.toClientDTO(true);
  }

  /**
   * 获取目标详情。
   */
  async getGoal(
    uuid: string,
    options?: { includeChildren?: boolean },
  ): Promise<GoalClientDTO | null> {
    const goal = await this.goalRepository.findById(uuid, options);
    return goal ? goal.toClientDTO(true) : null;
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
  ): Promise<GoalClientDTO[]> {
    const goals = await this.goalRepository.findByAccountUuid(accountUuid, options);
    const dtos = goals.map((g: Goal) => g.toClientDTO(true));

    return dtos;
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
      urgency: UrgencyLevel;
      category: string;
      deadline: number;
      tags: string[];
      metadata: any;
      color: string;
      feasibilityAnalysis: string;
      motivation: string;
    }>,
  ): Promise<GoalClientDTO> {
    // 1. 查询目标
    const goal = await this.goalRepository.findById(uuid);
    if (!goal) {
      throw new Error(`Goal not found: ${uuid}`);
    }

    // 2. 委托领域服务更新（业务逻辑）
    this.domainService.updateGoalBasicInfo(goal, updates);

    // 3. 持久化
    await this.goalRepository.save(goal);

    // 4. 发布领域事件
    await GoalEventPublisher.publishGoalEvents(goal);

    // 5. 返回 ClientDTO
    return goal.toClientDTO();
  }

  /**
   * 检查目标关联依赖（删除前检查）。
   */
  async checkGoalDependencies(uuid: string): Promise<{
    hasKeyResults: boolean;
    keyResultCount: number;
    hasReviews: boolean;
    reviewCount: number;
    hasTaskLinks: boolean; // 未来扩展：检查 Task 模块关联
    canDelete: boolean;
    warnings: string[];
  }> {
    // 1. 查询目标（包含子实体）
    const goal = await this.goalRepository.findById(uuid, { includeChildren: true });
    if (!goal) {
      throw new Error(`Goal not found: ${uuid}`);
    }

    const keyResults = goal.keyResults || [];
    const reviews = goal.reviews || [];
    const keyResultCount = keyResults.length;
    const reviewCount = reviews.length;

    const warnings: string[] = [];

    if (keyResultCount > 0) {
      warnings.push(`该目标包含 ${keyResultCount} 个关键结果`);
    }

    if (reviewCount > 0) {
      warnings.push(`该目标包含 ${reviewCount} 条复盘记录`);
    }

    // TODO: 未来检查 Task 模块关联
    // const hasTaskLinks = await this.checkTaskLinks(uuid);
    const hasTaskLinks = false;

    return {
      hasKeyResults: keyResultCount > 0,
      keyResultCount,
      hasReviews: reviewCount > 0,
      reviewCount,
      hasTaskLinks,
      canDelete: true, // 即使有关联也允许删除（级联删除）
      warnings,
    };
  }

  /**
   * 删除目标（软删除）。
   */
  async deleteGoal(uuid: string): Promise<void> {
    // 1. 查询目标（包含子实体）
    const goal = await this.goalRepository.findById(uuid, { includeChildren: true });
    if (!goal) {
      throw new Error(`Goal not found: ${uuid}`);
    }

    // 2. 调用聚合根的软删除方法
    goal.softDelete();

    // 3. 持久化（包括子实体）
    await this.goalRepository.save(goal);

    // 4. 发布领域事件
    await GoalEventPublisher.publishGoalEvents(goal);
  }

  /**
   * 归档目标。
   */
  async archiveGoal(uuid: string): Promise<GoalClientDTO> {
    // 1. 查询目标
    const goal = await this.goalRepository.findById(uuid);
    if (!goal) {
      throw new Error(`Goal not found: ${uuid}`);
    }

    // 2. 调用聚合根方法
    goal.archive();

    // 3. 持久化
    await this.goalRepository.save(goal);

    // 4. 发布领域事件
    await GoalEventPublisher.publishGoalEvents(goal);

    // 5. 返回 ClientDTO
    return goal.toClientDTO();
  }

  /**
   * 激活目标。
   */
  async activateGoal(uuid: string): Promise<GoalClientDTO> {
    // 1. 查询目标
    const goal = await this.goalRepository.findById(uuid);
    if (!goal) {
      throw new Error(`Goal not found: ${uuid}`);
    }

    // 2. 调用聚合根方法
    goal.activate();

    // 3. 持久化
    await this.goalRepository.save(goal);

    // 4. 发布领域事件
    await GoalEventPublisher.publishGoalEvents(goal);

    // 5. 返回 ClientDTO
    return goal.toClientDTO();
  }

  /**
   * 完成目标。
   */
  async completeGoal(uuid: string): Promise<GoalClientDTO> {
    // 1. 查询目标
    const goal = await this.goalRepository.findById(uuid);
    if (!goal) {
      throw new Error(`Goal not found: ${uuid}`);
    }

    // 2. 调用聚合根方法
    goal.complete();

    // 3. 持久化
    await this.goalRepository.save(goal);

    // 4. 发布领域事件
    await GoalEventPublisher.publishGoalEvents(goal);

    // 5. 返回 ClientDTO
    return goal.toClientDTO();
  }

  // ===== 查询操作 =====

  /**
   * 搜索目标。
   */
  async searchGoals(accountUuid: string, query: string): Promise<GoalClientDTO[]> {
    const goals = await this.goalRepository.findByAccountUuid(accountUuid, {});
    return goals
      .filter((g) => g.title.includes(query) || g.description?.includes(query))
      .map((g: Goal) => g.toClientDTO());
  }
}
