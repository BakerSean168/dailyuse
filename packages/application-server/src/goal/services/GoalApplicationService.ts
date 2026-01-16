/**
 * Goal Application Service (Server)
 *
 * Server-side application service for Goal operations.
 * Extracted from apps/api/src/modules/goal/application/services/GoalApplicationService.ts
 *
 * 职责：
 * - 创建目标
 * - 获取目标详情
 * - 更新目标基本信息
 * - 删除/归档/激活/完成目标
 * - 搜索目标
 */

import type { IGoalRepository } from '@dailyuse/domain-server/goal';
import { GoalDomainService, Goal } from '@dailyuse/domain-server/goal';
import type { GoalClientDTO } from '@dailyuse/contracts/goal';
import { ImportanceLevel } from '@dailyuse/contracts/shared';
import { eventBus } from '@dailyuse/utils';

/**
 * Event publisher helper
 */
async function publishGoalEvents(goal: Goal): Promise<void> {
  const events = goal.getUncommittedDomainEvents();
  for (const event of events) {
    await eventBus.emit(event.eventType, event);
  }
}

/**
 * Create Goal Params
 */
export interface CreateGoalParams {
  accountUuid: string;
  title: string;
  description?: string;
  importance: ImportanceLevel;
  // urgency: UrgencyLevel; // REMOVED - priority is now computed from importance + targetDate
  parentGoalUuid?: string;
  folderUuid?: string;
  startDate?: number;
  targetDate?: number;
  tags?: string[];
  metadata?: unknown;
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
}

/**
 * Update Goal Params
 */
export interface UpdateGoalParams {
  title?: string;
  description?: string;
  importance?: ImportanceLevel;
  // urgency?: UrgencyLevel; // REMOVED
  category?: string;
  deadline?: number;
  tags?: string[];
  metadata?: unknown;
  color?: string;
  feasibilityAnalysis?: string;
  motivation?: string;
}

/**
 * Goal Application Service
 */
export class GoalApplicationService {
  private readonly domainService: GoalDomainService;

  constructor(private readonly goalRepository: IGoalRepository) {
    this.domainService = new GoalDomainService();
  }

  /**
   * 创建目标
   */
  async createGoal(params: CreateGoalParams): Promise<GoalClientDTO> {
    // 1. 如果有父目标，先查询
    let parentGoal: Goal | undefined;
    if (params.parentGoalUuid) {
      const found = await this.goalRepository.findById(params.parentGoalUuid);
      if (!found) {
        throw new Error(`Parent goal not found: ${params.parentGoalUuid}`);
      }
      parentGoal = found;
    }

    // 2. 委托领域服务创建聚合根
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
    await publishGoalEvents(goal);

    // 6. 返回 ClientDTO
    return goal.toClientDTO(true);
  }

  /**
   * 获取目标详情
   */
  async getGoal(
    uuid: string,
    options?: { includeChildren?: boolean },
  ): Promise<GoalClientDTO | null> {
    const goal = await this.goalRepository.findById(uuid, options);
    return goal ? goal.toClientDTO(true) : null;
  }

  /**
   * 获取用户的所有目标
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
    return goals.map((g: Goal) => g.toClientDTO(true));
  }

  /**
   * 更新目标基本信息
   */
  async updateGoal(uuid: string, updates: UpdateGoalParams): Promise<GoalClientDTO> {
    // 1. 查询目标
    const goal = await this.goalRepository.findById(uuid);
    if (!goal) {
      throw new Error(`Goal not found: ${uuid}`);
    }

    // 2. 委托领域服务更新
    this.domainService.updateGoalBasicInfo(goal, updates);

    // 3. 持久化
    await this.goalRepository.save(goal);

    // 4. 发布领域事件
    await publishGoalEvents(goal);

    // 5. 返回 ClientDTO
    return goal.toClientDTO();
  }

  /**
   * 检查目标依赖
   */
  async checkGoalDependencies(uuid: string): Promise<{
    hasKeyResults: boolean;
    keyResultCount: number;
    hasReviews: boolean;
    reviewCount: number;
    hasTaskLinks: boolean;
    canDelete: boolean;
    warnings: string[];
  }> {
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

    return {
      hasKeyResults: keyResultCount > 0,
      keyResultCount,
      hasReviews: reviewCount > 0,
      reviewCount,
      hasTaskLinks: false, // TODO: Check task links
      canDelete: true,
      warnings,
    };
  }

  /**
   * 删除目标（软删除）
   */
  async deleteGoal(uuid: string): Promise<void> {
    const goal = await this.goalRepository.findById(uuid, { includeChildren: true });
    if (!goal) {
      throw new Error(`Goal not found: ${uuid}`);
    }

    goal.softDelete();
    await this.goalRepository.save(goal);
    await publishGoalEvents(goal);
  }

  /**
   * 归档目标
   */
  async archiveGoal(uuid: string): Promise<GoalClientDTO> {
    const goal = await this.goalRepository.findById(uuid);
    if (!goal) {
      throw new Error(`Goal not found: ${uuid}`);
    }

    goal.archive();
    await this.goalRepository.save(goal);
    await publishGoalEvents(goal);

    return goal.toClientDTO();
  }

  /**
   * 激活目标
   */
  async activateGoal(uuid: string): Promise<GoalClientDTO> {
    const goal = await this.goalRepository.findById(uuid);
    if (!goal) {
      throw new Error(`Goal not found: ${uuid}`);
    }

    goal.activate();
    await this.goalRepository.save(goal);
    await publishGoalEvents(goal);

    return goal.toClientDTO();
  }

  /**
   * 完成目标
   */
  async completeGoal(uuid: string): Promise<GoalClientDTO> {
    const goal = await this.goalRepository.findById(uuid);
    if (!goal) {
      throw new Error(`Goal not found: ${uuid}`);
    }

    goal.complete();
    await this.goalRepository.save(goal);
    await publishGoalEvents(goal);

    return goal.toClientDTO();
  }

  /**
   * 搜索目标
   */
  async searchGoals(accountUuid: string, query: string): Promise<GoalClientDTO[]> {
    const goals = await this.goalRepository.findByAccountUuid(accountUuid, {});
    return goals
      .filter((g) => g.title.includes(query) || g.description?.includes(query))
      .map((g: Goal) => g.toClientDTO());
  }
}

/**
 * Factory function to create GoalApplicationService
 */
export function createGoalApplicationService(
  goalRepository: IGoalRepository,
): GoalApplicationService {
  return new GoalApplicationService(goalRepository);
}
