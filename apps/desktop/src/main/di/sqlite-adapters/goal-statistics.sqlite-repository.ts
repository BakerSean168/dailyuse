/**
 * SQLite Goal Statistics Repository
 *
 * 实现 IGoalStatisticsRepository 接口的 SQLite 适配器
 */

import type { IGoalStatisticsRepository } from '@dailyuse/domain-server/goal';
import { GoalStatistics } from '@dailyuse/domain-server/goal';
import { getDatabase } from '../../database';

/**
 * GoalStatistics SQLite Repository 实现
 */
export class SqliteGoalStatisticsRepository implements IGoalStatisticsRepository {
  /**
   * 根据账户 UUID 查找统计信息
   */
  async findByAccountUuid(accountUuid: string): Promise<GoalStatistics | null> {
    const db = getDatabase();
    const row = db
      .prepare('SELECT * FROM goal_statistics WHERE account_uuid = ?')
      .get(accountUuid) as GoalStatisticsRow | undefined;

    if (!row) {
      return null;
    }

    return this.mapToEntity(row);
  }

  /**
   * 插入或更新统计信息
   */
  async upsert(statistics: GoalStatistics): Promise<GoalStatistics> {
    const db = getDatabase();
    const dto = statistics.toPersistenceDTO();

    const existing = db
      .prepare('SELECT 1 FROM goal_statistics WHERE account_uuid = ?')
      .get(dto.accountUuid);

    if (existing) {
      db.prepare(`
        UPDATE goal_statistics SET
          total_goals = ?,
          active_goals = ?,
          completed_goals = ?,
          archived_goals = ?,
          overdue_goals = ?,
          total_key_results = ?,
          completed_key_results = ?,
          average_progress = ?,
          goals_by_importance = ?,
          goals_by_urgency = ?,
          goals_by_category = ?,
          goals_by_status = ?,
          goals_created_this_week = ?,
          goals_completed_this_week = ?,
          goals_created_this_month = ?,
          goals_completed_this_month = ?,
          total_reviews = ?,
          average_rating = ?,
          last_calculated_at = ?
        WHERE account_uuid = ?
      `).run(
        dto.totalGoals,
        dto.activeGoals,
        dto.completedGoals,
        dto.archivedGoals,
        dto.overdueGoals,
        dto.totalKeyResults,
        dto.completedKeyResults,
        dto.averageProgress,
        dto.goalsByImportance,
        '{}',  // goals_by_urgency kept for DB compatibility
        dto.goalsByCategory,
        dto.goalsByStatus,
        dto.goalsCreatedThisWeek,
        dto.goalsCompletedThisWeek,
        dto.goalsCreatedThisMonth,
        dto.goalsCompletedThisMonth,
        dto.totalReviews,
        dto.averageRating,
        dto.lastCalculatedAt,
        dto.accountUuid
      );
    } else {
      db.prepare(`
        INSERT INTO goal_statistics (
          account_uuid, total_goals, active_goals, completed_goals,
          archived_goals, overdue_goals, total_key_results, completed_key_results,
          average_progress, goals_by_importance, goals_by_urgency, goals_by_category,
          goals_by_status, goals_created_this_week, goals_completed_this_week,
          goals_created_this_month, goals_completed_this_month, total_reviews,
          average_rating, last_calculated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        dto.accountUuid,
        dto.totalGoals,
        dto.activeGoals,
        dto.completedGoals,
        dto.archivedGoals,
        dto.overdueGoals,
        dto.totalKeyResults,
        dto.completedKeyResults,
        dto.averageProgress,
        dto.goalsByImportance,
        '{}',  // goals_by_urgency kept for DB compatibility
        dto.goalsByCategory,
        dto.goalsByStatus,
        dto.goalsCreatedThisWeek,
        dto.goalsCompletedThisWeek,
        dto.goalsCreatedThisMonth,
        dto.goalsCompletedThisMonth,
        dto.totalReviews,
        dto.averageRating,
        dto.lastCalculatedAt
      );
    }

    return statistics;
  }

  /**
   * 删除统计信息
   */
  async delete(accountUuid: string): Promise<boolean> {
    const db = getDatabase();
    const result = db
      .prepare('DELETE FROM goal_statistics WHERE account_uuid = ?')
      .run(accountUuid);
    return result.changes > 0;
  }

  /**
   * 检查统计信息是否存在
   */
  async exists(accountUuid: string): Promise<boolean> {
    const db = getDatabase();
    const row = db
      .prepare('SELECT 1 FROM goal_statistics WHERE account_uuid = ?')
      .get(accountUuid);
    return !!row;
  }

  private mapToEntity(row: GoalStatisticsRow): GoalStatistics {
    return GoalStatistics.fromPersistenceDTO({
      accountUuid: row.account_uuid,
      totalGoals: row.total_goals,
      activeGoals: row.active_goals,
      completedGoals: row.completed_goals,
      archivedGoals: row.archived_goals,
      overdueGoals: row.overdue_goals,
      totalKeyResults: row.total_key_results,
      completedKeyResults: row.completed_key_results,
      averageProgress: row.average_progress,
      goalsByImportance: row.goals_by_importance,
      goalsByCategory: row.goals_by_category,
      goalsByStatus: row.goals_by_status,
      goalsCreatedThisWeek: row.goals_created_this_week,
      goalsCompletedThisWeek: row.goals_completed_this_week,
      goalsCreatedThisMonth: row.goals_created_this_month,
      goalsCompletedThisMonth: row.goals_completed_this_month,
      totalReviews: row.total_reviews,
      averageRating: row.average_rating,
      lastCalculatedAt: row.last_calculated_at,
    });
  }
}

interface GoalStatisticsRow {
  account_uuid: string;
  total_goals: number;
  active_goals: number;
  completed_goals: number;
  archived_goals: number;
  overdue_goals: number;
  total_key_results: number;
  completed_key_results: number;
  average_progress: number;
  goals_by_importance: string;
  goals_by_category: string;
  goals_by_status: string;
  goals_created_this_week: number;
  goals_completed_this_week: number;
  goals_created_this_month: number;
  goals_completed_this_month: number;
  total_reviews: number;
  average_rating: number | null;
  last_calculated_at: number;
}
