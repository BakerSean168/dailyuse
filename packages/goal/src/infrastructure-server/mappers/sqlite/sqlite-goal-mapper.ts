/**
 * SQLite Goal Mapper
 *
 * Maps between Goal domain aggregate and SQLite row.
 * SQLite 存储日期为 INTEGER（毫秒时间戳）
 */

import type {
  GoalPersistenceDTO,
  KeyResultPersistenceDTO,
  GoalReviewPersistenceDTO,
  KeyResultWeightSnapshotDTO,
} from '@dailyuse/contracts/goal';
import { Goal } from '@/domain-server';
import { persistenceDtoToGoalState } from '../goal-state-mapper';

/**
 * SQLiteGoalMapper
 * 
 * 实现 SQLite 行 ↔ Goal 领域聚合根 的双向映射
 */
export class SqliteGoalMapper {
  /**
   * SQLite row → GoalPersistenceDTO → Goal 聚合根
   * 
   * @param row - SQLite 查询返回的行数据
   * @param children - 可选的子实体数据（keyResults, goalReviews, weightSnapshots）
   */
  static toDomain(
    row: any,
    children?: {
      keyResults?: KeyResultPersistenceDTO[] | null;
      goalReviews?: GoalReviewPersistenceDTO[] | null;
      weightSnapshots?: KeyResultWeightSnapshotDTO[] | null;
    },
  ): Goal {
    const dto = SqliteGoalMapper.toPersistenceDTO(row, children);
    return Goal.load(persistenceDtoToGoalState(dto));
  }

  /**
   * SQLite row → GoalPersistenceDTO
   */
  static toPersistenceDTO(
    row: any,
    children?: {
      keyResults?: KeyResultPersistenceDTO[] | null;
      goalReviews?: GoalReviewPersistenceDTO[] | null;
      weightSnapshots?: KeyResultWeightSnapshotDTO[] | null;
    },
  ): GoalPersistenceDTO {
    return {
      id: row.id,
      identityId: row.identity_id,
      name: row.name,
      description: row.description ?? null,
      color: row.color ?? '#4A90D9',
      feasibilityAnalysis: row.feasibility_analysis ?? null,
      motivation: row.motivation ?? null,
      status: row.status,
      importance: row.importance ?? 'MEDIUM',
      priority: row.priority ?? 0,
      category: row.category ?? null,
      tags: row.tags ? JSON.parse(row.tags) : [],
      startDate: row.start_date ? new Date(row.start_date) : null,
      targetDate: row.target_date ? new Date(row.target_date) : null,
      completedAt: row.completed_at ? new Date(row.completed_at) : null,
      archivedAt: row.archived_at ? new Date(row.archived_at) : null,
      folderId: row.folder_id ?? null,
      parentGoalId: row.parent_goal_id ?? null,
      sortOrder: row.sort_order ?? 0,
      reminderConfig: row.reminder_config
        ? JSON.parse(row.reminder_config)
        : null,
      version: row.version ?? 1,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
      keyResults: children?.keyResults ?? null,
      goalReviews: children?.goalReviews ?? null,
      weightSnapshots: children?.weightSnapshots ?? null,
    };
  }

  /**
   * SQLite KeyResult row → KeyResultPersistenceDTO
   */
  static mapKeyResultRow(row: any): KeyResultPersistenceDTO {
    return {
      id: row.id,
      goalId: row.goal_id,
      title: row.title,
      description: row.description ?? null,
      progress: row.progress ?? '{}',
      weight: row.weight,
      sortOrder: row.sort_order,
      version: row.version ?? 1,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
    };
  }

  /**
   * SQLite GoalReview row → GoalReviewPersistenceDTO
   */
  static mapGoalReviewRow(row: any): GoalReviewPersistenceDTO {
    return {
      id: row.id,
      goalId: row.goal_id,
      type: row.type,
      rating: row.rating,
      summary: row.summary ?? '',
      achievements: row.achievements ?? null,
      challenges: row.challenges ?? null,
      improvements: row.improvements ?? null,
      keyResultSnapshots: row.key_result_snapshots ?? '[]',
      reviewedAt: new Date(row.reviewed_at),
      version: row.version ?? 1,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
    };
  }

  /**
   * SQLite WeightSnapshot row → KeyResultWeightSnapshotDTO
   */
  static mapWeightSnapshotRow(row: any): KeyResultWeightSnapshotDTO {
    return {
      id: row.id,
      goalId: row.goal_id,
      keyResultId: row.key_result_id,
      oldWeight: row.old_weight,
      newWeight: row.new_weight,
      weightDelta: row.weight_delta,
      snapshotTime: row.snapshot_time,
      trigger: row.trigger,
      reason: row.reason ?? null,
      operatorId: row.operator_id,
      createdAt: row.created_at,
    };
  }
}

/**
 * Date → INTEGER (millis) 转换工具
 */
export function dateToInt(d: Date | null | undefined): number | null {
  if (!d) return null;
  return d instanceof Date ? d.getTime() : (d as number);
}
