import { ImportanceLevel } from '@dailyuse/contracts/shared';
import { Goal } from '../aggregates/Goal';
import { GoalReminderConfig } from '../value-objects/GoalReminderConfig';
import { GoalStatus } from '@dailyuse/contracts/goal';
import type { GoalReminderConfigServerDTO } from '@dailyuse/contracts/goal';


/**
 * Goal 领域服务
 *
 * DDD 领域服务职责：
 * - 创建聚合根（调用工厂方法）
 * - 跨聚合根的业务逻辑协调
 * - 复杂的领域规则验证
 * - 不涉及持久化（由 ApplicationService 负责）
 *
 * 注意：
 * - 不注入 Repository（避免在领域层持久化）
 * - 只返回聚合根对象，由 ApplicationService 负责保存
 * - 业务逻辑尽量放在聚合根内部
 */
export class GoalDomainService {
  constructor() {
    // 领域服务不注入仓储
  }

  /**
   * 创建目标聚合根
   *
   * @param params 创建参数
   * @param parentGoal 可选的父目标（由 ApplicationService 查询后传入）
   * @returns 新创建的目标聚合根（未持久化）
   */
  public createGoal(
    params: {
      accountUuid: string;
      name: string;
      description?: string;
      importance?: ImportanceLevel;
      // urgency?: UrgencyLevel; // REMOVED - priority is now computed
      category?: string;
      tags?: string[];
      startDate?: number;
      targetDate?: number;
      folderUuid?: string;
      parentGoalUuid?: string;
      reminderConfig?: GoalReminderConfigServerDTO;
      color?: string;
      feasibilityAnalysis?: string;
      motivation?: string;
    },
    parentGoal?: Goal,
  ): Goal {
    // 1. 验证标题
    this.validateGoalTitle(params.name);

    // 2. 验证日期范围
    this.validateGoalDateRange(params.startDate, params.targetDate);

    // 3. 验证父目标是否存在（如果需要）
    if (params.parentGoalUuid && !parentGoal) {
      throw new Error(`Parent goal is required when parentGoalUuid is provided`);
    }

    // 4. 验证父目标状态（复杂业务规则）
    if (parentGoal) {
      if (parentGoal.status === GoalStatus.ARCHIVED) {
        throw new Error('Cannot create sub-goal under an archived goal');
      }
      if (parentGoal.deletedAt !== null && parentGoal.deletedAt !== undefined) {
        throw new Error('Cannot create sub-goal under a deleted goal');
      }
    }

    // 5. 转换 reminderConfig DTO 为值对象（如果提供）
    const reminderConfig = params.reminderConfig
      ? GoalReminderConfig.fromServerDTO(params.reminderConfig)
      : undefined;

    // 6. 创建聚合根（业务逻辑在聚合根内部）
    const goal = Goal.create({
      ...params,
      reminderConfig,
    });

    // 7. 返回聚合根（不持久化）
    return goal;
  }

  /**
   * 更新目标基本信息
   *
   * @param goal 目标聚合根（由 ApplicationService 查询后传入）
   * @param params 更新参数
   */
  public updateGoalBasicInfo(
    goal: Goal,
    params: {
      title?: string;
      description?: string;
      importance?: ImportanceLevel;
      // urgency?: UrgencyLevel; // REMOVED
      category?: string;
      color?: string;
      feasibilityAnalysis?: string;
      motivation?: string;
    },
  ): void {
    // 验证目标状态
    if (goal.deletedAt !== null && goal.deletedAt !== undefined) {
      throw new Error('Cannot update a deleted goal');
    }

    // 验证标题（如果更新）
    if (params.title !== undefined) {
      this.validateGoalTitle(params.title);
    }

    // 调用聚合根方法（业务逻辑在聚合根内部）
    goal.updateBasicInfo(params);
  }

  /**
   * 添加关键结果
   *
   * @param goal 目标聚合根
   * @param params 关键结果参数
   */
  public addKeyResultToGoal(
    goal: Goal,
    params: {
      title: string;
      description?: string;
      valueType: string;
      aggregationMethod?: string;
      targetValue: number;
      currentValue?: number;
      unit?: string;
      weight: number;
    },
  ): void {
    // 验证目标状态
    if (goal.deletedAt !== null && goal.deletedAt !== undefined) {
      throw new Error('Cannot add key result to a deleted goal');
    }
    if (goal.status === GoalStatus.ARCHIVED) {
      throw new Error('Cannot add key result to an archived goal');
    }

    // 验证权重范围
    if (params.weight < 0 || params.weight > 100) {
      throw new Error('Key result weight must be between 0 and 100');
    }

    // 创建并添加关键结果
    const keyResult = goal.createKeyResult(params);
    goal.addKeyResult(keyResult);
  }

  /**
   * 更新关键结果进度
   *
   * @param goal 目标聚合根
   * @param keyResultUuid 关键结果 UUID
   * @param currentValue 当前值
   * @param note 备注
   */
  public updateKeyResultProgress(
    goal: Goal,
    keyResultUuid: string,
    currentValue: number,
    note?: string,
  ): void {
    // 验证目标状态
    if (goal.deletedAt !== null && goal.deletedAt !== undefined) {
      throw new Error('Cannot update key result of a deleted goal');
    }

    // 调用聚合根方法
    goal.updateKeyResultProgress(keyResultUuid, currentValue, note);
  }

  /**
   * 添加目标回顾
   *
   * @param goal 目标聚合根
   * @param params 回顾参数
   */
  public addReviewToGoal(
    goal: Goal,
    params: {
      title: string;
      content: string;
      reviewType: string;
      rating?: number;
      achievements?: string;
      challenges?: string;
      nextActions?: string;
    },
  ): void {
    // 验证目标状态
    if (goal.deletedAt !== null && goal.deletedAt !== undefined) {
      throw new Error('Cannot add review to a deleted goal');
    }

    // 验证评分范围
    if (params.rating !== undefined && (params.rating < 0 || params.rating > 10)) {
      throw new Error('Review rating must be between 0 and 10');
    }

    // 创建并添加回顾
    const review = goal.createReview(params);
    goal.addReview(review);
  }

  /**
   * 验证目标标题
   *
   * @param title 标题
   */
  private validateGoalTitle(title: string): void {
    const trimmed = title.trim();
    if (trimmed.length === 0) {
      throw new Error('Goal title cannot be empty');
    }
    if (trimmed.length > 200) {
      throw new Error('Goal title is too long (max 200 characters)');
    }
  }

  /**
   * 验证目标日期范围
   *
   * @param startDate 开始日期
   * @param targetDate 目标日期
   */
  private validateGoalDateRange(startDate?: number, targetDate?: number): void {
    if (startDate && targetDate && startDate > targetDate) {
      throw new Error('Start date cannot be after target date');
    }
  }
}
