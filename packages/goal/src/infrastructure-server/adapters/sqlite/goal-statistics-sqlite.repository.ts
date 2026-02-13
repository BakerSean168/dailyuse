/**
 * SQLite GoalStatistics Repository Implementation
 * 目标统计的 SQLite 仓储实现
 */

import type Database from 'better-sqlite3';
import { GoalStatistics } from '@/domain-server';
import type { IGoalStatisticsRepository } from '@/domain-server';
import type { GoalStatisticsPersistenceDTO } from '@/domain-server/aggregates/GoalStatistics';

export class SqliteGoalStatisticsRepository implements IGoalStatisticsRepository {
  constructor(private db: Database.Database) {}

  async findByAccountUuid(accountUuid: string): Promise<GoalStatistics | null> {
    const row = this.db
      .prepare(`SELECT * FROM goal_statistics WHERE account_uuid = ? LIMIT 1`)
      .get(accountUuid) as any;

    if (!row) return null;

    return this.rowToStatistics(row);
  }

  async upsert(statistics: GoalStatistics): Promise<GoalStatistics> {
    const dto = statistics.toPersistenceDTO();

    this.db
      .prepare(
        `INSERT INTO goal_statistics (
        account_uuid, total_goals, active_goals, completed_goals,
        archived_goals, overdue_goals, total_key_results, completed_key_results,
        average_progress, goals_by_importance, goals_by_category, goals_by_status,
        goals_created_this_week, goals_completed_this_week,
        goals_created_this_month, goals_completed_this_month,
        total_reviews, average_rating, last_calculated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(account_uuid) DO UPDATE SET
        total_goals = excluded.total_goals,
        active_goals = excluded.active_goals,
        completed_goals = excluded.completed_goals,
        archived_goals = excluded.archived_goals,
        overdue_goals = excluded.overdue_goals,
        total_key_results = excluded.total_key_results,
        completed_key_results = excluded.completed_key_results,
        average_progress = excluded.average_progress,
        goals_by_importance = excluded.goals_by_importance,
        goals_by_category = excluded.goals_by_category,
        goals_by_status = excluded.goals_by_status,
        goals_created_this_week = excluded.goals_created_this_week,
        goals_completed_this_week = excluded.goals_completed_this_week,
        goals_created_this_month = excluded.goals_created_this_month,
        goals_completed_this_month = excluded.goals_completed_this_month,
        total_reviews = excluded.total_reviews,
        average_rating = excluded.average_rating,
        last_calculated_at = excluded.last_calculated_at`,
      )
      .run(
        dto.accountUuid,
        dto.totalGoals,
        dto.activeGoals,
        dto.completedGoals,
        dto.archivedGoals,
        dto.overdueGoals,
        dto.totalKeyResults,
        dto.completedKeyResults,
        dto.averageProgress,
        JSON.stringify(dto.goalsByImportance),
        JSON.stringify(dto.goalsByCategory),
        JSON.stringify(dto.goalsByStatus),
        dto.goalsCreatedThisWeek,
        dto.goalsCompletedThisWeek,
        dto.goalsCreatedThisMonth,
        dto.goalsCompletedThisMonth,
        dto.totalReviews,
        dto.averageRating,
        dto.lastCalculatedAt,
      );

    return statistics;
  }

  async delete(accountUuid: string): Promise<boolean> {
    const result = this.db
      .prepare(`DELETE FROM goal_statistics WHERE account_uuid = ?`)
      .run(accountUuid);
    return (result.changes ?? 0) > 0;
  }

  async exists(accountUuid: string): Promise<boolean> {
    const row = this.db
      .prepare(`SELECT 1 FROM goal_statistics WHERE account_uuid = ? LIMIT 1`)
      .get(accountUuid);
    return row !== undefined;
  }

  private rowToStatistics(row: any): GoalStatistics {
    const dto: GoalStatisticsPersistenceDTO = {
      accountUuid: row.account_uuid,
      totalGoals: row.total_goals ?? 0,
      activeGoals: row.active_goals ?? 0,
      completedGoals: row.completed_goals ?? 0,
      archivedGoals: row.archived_goals ?? 0,
      overdueGoals: row.overdue_goals ?? 0,
      totalKeyResults: row.total_key_results ?? 0,
      completedKeyResults: row.completed_key_results ?? 0,
      averageProgress: row.average_progress ?? 0,
      goalsByImportance: row.goals_by_importance
        ? JSON.parse(row.goals_by_importance)
        : {},
      goalsByCategory: row.goals_by_category
        ? JSON.parse(row.goals_by_category)
        : {},
      goalsByStatus: row.goals_by_status
        ? JSON.parse(row.goals_by_status)
        : {},
      goalsCreatedThisWeek: row.goals_created_this_week ?? 0,
      goalsCompletedThisWeek: row.goals_completed_this_week ?? 0,
      goalsCreatedThisMonth: row.goals_created_this_month ?? 0,
      goalsCompletedThisMonth: row.goals_completed_this_month ?? 0,
      totalReviews: row.total_reviews ?? 0,
      averageRating: row.average_rating ?? 0,
      lastCalculatedAt: row.last_calculated_at ?? Date.now(),
    };

    return GoalStatistics.fromPersistenceDTO(dto);
  }
}
