/**
 * GoalStatistics 领域服务
 *
 * DDD 领域服务职责：
 * - 统计数据的业务逻辑协调
 * - 初始化和重新计算统计
 * - 响应目标事件更新统计
 * - 使用仓储接口进行持久化
 *
 * 架构说明：
 * - 注入 IGoalStatisticsRepository 和 IGoalRepository
 * - 提供增量更新方法（事件驱动）
 * - 提供完全重算方法（数据修复）
 * - 所有业务逻辑委托给 GoalStatistics 聚合根
 */

import { GoalStatistics } from '../aggregates/GoalStatistics';
import type { Goal } from '../aggregates/Goal';
import type { GoalStatisticsUpdateEvent } from '@dailyuse/contracts/goal';
import { GoalStatus } from '@dailyuse/contracts/goal';

/**
 * GoalStatisticsDomainService
 *
 * 纯业务逻辑服务，负责统计数据的计算和更新
 * 不包含任何持久化逻辑
 */
export class GoalStatisticsDomainService {
  constructor() {}

  /**
   * 根据事件更新统计聚合根
   *
   * @param statistics 统计聚合根
   * @param event 更新事件
   */
  public applyEventToStatistics(
    statistics: GoalStatistics,
    event: GoalStatisticsUpdateEvent,
  ): void {
    // 根据事件类型更新统计
    switch (event.type) {
      case 'goal.created':
        statistics.onGoalCreated(event);
        break;

      case 'goal.deleted':
        statistics.onGoalDeleted(event);
        break;

      case 'goal.status_changed':
        statistics.onGoalStatusChanged(event);
        break;

      case 'goal.completed':
        statistics.onGoalCompleted(event);
        break;

      case 'goal.archived':
        statistics.onGoalArchived(event);
        break;

      case 'goal.activated':
        statistics.onGoalActivated(event);
        break;

      case 'key_result.created':
        statistics.onKeyResultCreated(event);
        break;

      case 'key_result.deleted':
        statistics.onKeyResultDeleted(event);
        break;

      case 'key_result.completed':
        statistics.onKeyResultCompleted(event);
        break;

      case 'review.created':
        statistics.onReviewCreated(event);
        break;

      case 'review.deleted':
        statistics.onReviewDeleted(event);
        break;

      case 'focus_session.completed':
        statistics.onFocusSessionCompleted(event);
        break;

      default:
        // 未知事件类型，记录警告
        console.warn(`Unknown goal statistics update event type: ${(event as any).type}`);
    }
  }

  /**
   * 从Goal数组重新计算统计（纯计算）
   *
   * @param accountUuid 账户UUID
   * @param goals 目标列表
   * @returns 新的统计聚合根
   */
  public calculateStatisticsFromGoals(accountUuid: string, goals: Goal[]): GoalStatistics {
    // 创建空统计对象
    const statistics = GoalStatistics.createEmpty(accountUuid);

    // 遍历Goal并更新统计
    for (const goal of goals) {
      // 模拟Goal创建事件
      const event: GoalStatisticsUpdateEvent = {
        type: 'goal.created',
        accountUuid,
        timestamp: goal.createdAt || Date.now(),
        payload: {
          importance: goal.importance,
          // urgency removed - priority is now computed
          category: goal.category || undefined,
          newStatus: goal.status as GoalStatus,
        },
      };
      statistics.onGoalCreated(event);

      // 如果目标已完成，触发完成事件
      if (goal.status === 'COMPLETED' && goal.completedAt) {
        statistics.onGoalCompleted({
          type: 'goal.completed',
          accountUuid,
          timestamp: goal.completedAt,
          payload: {
            newStatus: GoalStatus.COMPLETED,
          },
        });
      }

      // 如果目标已归档，触发归档事件
      if (goal.status === 'ARCHIVED') {
        statistics.onGoalArchived({
          type: 'goal.archived',
          accountUuid,
          timestamp: Date.now(),
          payload: {
            newStatus: GoalStatus.ARCHIVED,
          },
        });
      }

      // 关键结果统计
      const keyResults = goal.keyResults || [];
      for (const kr of keyResults) {
        statistics.onKeyResultCreated({
          type: 'key_result.created',
          accountUuid,
          timestamp: Date.now(),
          payload: {},
        });

        // 如果关键结果已完成（检查progress字段）
        if (kr.progress && kr.progress.currentValue >= kr.progress.targetValue) {
          statistics.onKeyResultCompleted({
            type: 'key_result.completed',
            accountUuid,
            timestamp: Date.now(),
            payload: {},
          });
        }
      }

      // 回顾统计
      const reviews = goal.reviews || [];
      for (const review of reviews) {
        statistics.onReviewCreated({
          type: 'review.created',
          accountUuid,
          timestamp: Date.now(),
          payload: {
            rating: review.rating ?? undefined,
          },
        });
      }
    }

    return statistics;
  }
}
