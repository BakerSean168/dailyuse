/**
 * SQLite Goal Repository Implementation
 * 目标的 SQLite 仓储实现
 *
 * 使用 better-sqlite3 同步 API，外层 async 包装以满足接口
 * 事务内级联保存 Goal 聚合（KeyResult, GoalReview, WeightSnapshot）
 */

import type Database from 'better-sqlite3';
import { Goal } from '@/domain-server';
import type { IGoalRepository } from '@/domain-server';
import { SqliteGoalMapper, dateToInt } from '../../mappers/sqlite/sqlite-goal-mapper';

export class SqliteGoalRepository implements IGoalRepository {
  constructor(private db: Database.Database) {}

  // ============ Save (Cascade Transaction) ============

  async save(goal: Goal): Promise<void> {
    const dto = goal.toServerDTO(true);

    const transaction = this.db.transaction(() => {
      // 1. Upsert Goal root
      this.db
        .prepare(
          `INSERT INTO goals (
          id, identity_id, name, description, color, feasibility_analysis,
          motivation, status, importance, priority, category, tags,
          start_date, target_date, completed_at, archived_at,
          folder_id, parent_goal_id, sort_order, reminder_config,
          version, created_at, updated_at, deleted_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?
        )
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          description = excluded.description,
          color = excluded.color,
          feasibility_analysis = excluded.feasibility_analysis,
          motivation = excluded.motivation,
          status = excluded.status,
          importance = excluded.importance,
          priority = excluded.priority,
          category = excluded.category,
          tags = excluded.tags,
          start_date = excluded.start_date,
          target_date = excluded.target_date,
          completed_at = excluded.completed_at,
          archived_at = excluded.archived_at,
          folder_id = excluded.folder_id,
          parent_goal_id = excluded.parent_goal_id,
          sort_order = excluded.sort_order,
          reminder_config = excluded.reminder_config,
          version = excluded.version,
          updated_at = excluded.updated_at,
          deleted_at = excluded.deleted_at`,
        )
        .run(
          dto.id as string,
          dto.identityId as string,
          dto.name,
          dto.description,
          dto.color,
          dto.feasibilityAnalysis,
          dto.motivation,
          dto.status,
          dto.importance,
          dto.priority,
          dto.category,
          JSON.stringify(dto.tags),
          dateToInt(dto.startDate),
          dateToInt(dto.targetDate),
          dateToInt(dto.completedAt),
          dateToInt(dto.archivedAt),
          dto.folderId ? (dto.folderId as string) : null,
          dto.parentGoalId ? (dto.parentGoalId as string) : null,
          dto.sortOrder,
          dto.reminderConfig ? JSON.stringify(dto.reminderConfig) : null,
          dto.version,
          dateToInt(dto.createdAt),
          dateToInt(dto.updatedAt),
          dateToInt(dto.deletedAt),
        );

      // 2. Sync KeyResults
      if (dto.keyResults) {
        const currentKrIds = dto.keyResults.map((kr) => kr.id as string);

        // Delete removed KRs
        if (currentKrIds.length > 0) {
          const placeholders = currentKrIds.map(() => '?').join(',');
          this.db
            .prepare(
              `DELETE FROM key_results WHERE goal_id = ? AND id NOT IN (${placeholders})`,
            )
            .run(dto.id as string, ...currentKrIds);
        } else {
          this.db
            .prepare(`DELETE FROM key_results WHERE goal_id = ?`)
            .run(dto.id as string);
        }

        // Upsert each KR
        const krStmt = this.db.prepare(`
          INSERT INTO key_results (
            id, goal_id, title, description, progress, weight,
            sort_order, version, created_at, updated_at, deleted_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            title = excluded.title,
            description = excluded.description,
            progress = excluded.progress,
            weight = excluded.weight,
            sort_order = excluded.sort_order,
            version = excluded.version,
            updated_at = excluded.updated_at,
            deleted_at = excluded.deleted_at
        `);

        for (const kr of dto.keyResults) {
          const progress = typeof kr.progress === 'string' ? kr.progress : JSON.stringify(kr.progress);
          krStmt.run(
            kr.id as string,
            dto.id as string,
            kr.title,
            kr.description,
            progress,
            kr.weight,
            kr.sortOrder,
            kr.version,
            dateToInt(kr.createdAt),
            dateToInt(kr.updatedAt),
            dateToInt(kr.deletedAt),
          );
        }
      }

      // 3. Sync GoalReviews
      if (dto.goalReviews) {
        const currentReviewIds = dto.goalReviews.map((r) => r.id as string);

        if (currentReviewIds.length > 0) {
          const placeholders = currentReviewIds.map(() => '?').join(',');
          this.db
            .prepare(
              `DELETE FROM goal_reviews WHERE goal_id = ? AND id NOT IN (${placeholders})`,
            )
            .run(dto.id as string, ...currentReviewIds);
        } else {
          this.db
            .prepare(`DELETE FROM goal_reviews WHERE goal_id = ?`)
            .run(dto.id as string);
        }

        const reviewStmt = this.db.prepare(`
          INSERT INTO goal_reviews (
            id, goal_id, type, rating, summary, achievements,
            challenges, improvements, key_result_snapshots,
            reviewed_at, version, created_at, updated_at, deleted_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            type = excluded.type,
            rating = excluded.rating,
            summary = excluded.summary,
            achievements = excluded.achievements,
            challenges = excluded.challenges,
            improvements = excluded.improvements,
            key_result_snapshots = excluded.key_result_snapshots,
            reviewed_at = excluded.reviewed_at,
            version = excluded.version,
            updated_at = excluded.updated_at,
            deleted_at = excluded.deleted_at
        `);

        for (const review of dto.goalReviews) {
          reviewStmt.run(
            review.id as string,
            dto.id as string,
            review.type,
            review.rating,
            review.summary,
            review.achievements,
            review.challenges,
            review.improvements,
            typeof review.keyResultSnapshots === 'string'
              ? review.keyResultSnapshots
              : JSON.stringify(review.keyResultSnapshots ?? []),
            dateToInt(review.reviewedAt),
            review.version,
            dateToInt(review.createdAt),
            dateToInt(review.updatedAt),
            dateToInt(review.deletedAt),
          );
        }
      }

      // 4. Sync WeightSnapshots (append-only, no delete)
      if (dto.weightSnapshots && dto.weightSnapshots.length > 0) {
        const wsStmt = this.db.prepare(`
          INSERT OR IGNORE INTO weight_snapshots (
            id, goal_id, key_result_id, old_weight, new_weight, weight_delta,
            snapshot_time, trigger, reason, operator_id, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const ws of dto.weightSnapshots) {
          wsStmt.run(
            ws.id as string,
            ws.goalId as string,
            ws.keyResultId as string,
            ws.oldWeight,
            ws.newWeight,
            ws.weightDelta,
            ws.snapshotTime,
            ws.trigger,
            ws.reason,
            ws.operatorId as string,
            ws.createdAt,
          );
        }
      }
    });

    transaction();
  }

  // ============ Find ============

  async findById(
    id: string,
    options?: { includeChildren?: boolean },
  ): Promise<Goal | null> {
    const row = this.db
      .prepare(`SELECT * FROM goals WHERE id = ? LIMIT 1`)
      .get(id) as any;

    if (!row) return null;

    return this.rowToGoal(row, options?.includeChildren ?? false);
  }

  async findByIdentityId(
    identityId: string,
    options?: {
      includeChildren?: boolean;
      status?: string;
      folderId?: string;
    },
  ): Promise<Goal[]> {
    let query = `SELECT * FROM goals WHERE identity_id = ? AND deleted_at IS NULL`;
    const params: any[] = [identityId];

    if (options?.status) {
      query += ` AND status = ?`;
      params.push(options.status);
    }

    if (options?.folderId) {
      query += ` AND folder_id = ?`;
      params.push(options.folderId);
    }

    query += ` ORDER BY sort_order ASC, created_at DESC`;

    const rows = this.db.prepare(query).all(...params) as any[];

    return rows.map((row) =>
      this.rowToGoal(row, options?.includeChildren ?? false),
    );
  }

  async findByFolderId(folderId: string): Promise<Goal[]> {
    const rows = this.db
      .prepare(
        `SELECT * FROM goals WHERE folder_id = ? AND deleted_at IS NULL ORDER BY sort_order ASC, created_at DESC`,
      )
      .all(folderId) as any[];

    return rows.map((row) => this.rowToGoal(row, false));
  }

  // ============ Delete ============

  async delete(id: string): Promise<void> {
    this.db.transaction(() => {
      // CASCADE via FK will handle sub-entities, but be explicit
      this.db.prepare(`DELETE FROM goal_reviews WHERE goal_id = ?`).run(id);
      this.db.prepare(`DELETE FROM key_results WHERE goal_id = ?`).run(id);
      this.db
        .prepare(`DELETE FROM weight_snapshots WHERE goal_id = ?`)
        .run(id);
      this.db.prepare(`DELETE FROM goals WHERE id = ?`).run(id);
    })();
  }

  // ============ Utilities ============

  async exists(id: string): Promise<boolean> {
    const row = this.db
      .prepare(`SELECT 1 FROM goals WHERE id = ? LIMIT 1`)
      .get(id);
    return row !== undefined;
  }

  async batchUpdateStatus(ids: string[], status: string): Promise<void> {
    if (ids.length === 0) return;
    const placeholders = ids.map(() => '?').join(',');
    this.db
      .prepare(
        `UPDATE goals SET status = ?, updated_at = ? WHERE id IN (${placeholders})`,
      )
      .run(status, Date.now(), ...ids);
  }

  async batchMoveToFolder(
    ids: string[],
    folderId: string | null,
  ): Promise<void> {
    if (ids.length === 0) return;
    const placeholders = ids.map(() => '?').join(',');
    this.db
      .prepare(
        `UPDATE goals SET folder_id = ?, updated_at = ? WHERE id IN (${placeholders})`,
      )
      .run(folderId, Date.now(), ...ids);
  }

  // ============ Hierarchy ============

  async isAncestor(
    potentialAncestorId: string,
    potentialDescendantId: string,
  ): Promise<boolean> {
    let currentId: string | null = potentialDescendantId;
    const visited = new Set<string>();

    while (currentId) {
      if (currentId === potentialAncestorId) return true;
      if (visited.has(currentId)) break; // circular reference guard
      visited.add(currentId);

      const row = this.db
        .prepare(`SELECT parent_goal_id FROM goals WHERE id = ?`)
        .get(currentId) as any;
      currentId = row?.parent_goal_id ?? null;
    }

    return false;
  }

  async findChildren(parentId: string): Promise<Goal[]> {
    const rows = this.db
      .prepare(
        `SELECT * FROM goals WHERE parent_goal_id = ? AND deleted_at IS NULL ORDER BY sort_order ASC`,
      )
      .all(parentId) as any[];

    return rows.map((row) => this.rowToGoal(row, false));
  }

  // ============ Private Helpers ============

  private rowToGoal(row: any, includeChildren: boolean): Goal {
    const children = includeChildren
      ? {
          keyResults: this.loadKeyResults(row.id),
          goalReviews: this.loadGoalReviews(row.id),
          weightSnapshots: this.loadWeightSnapshots(row.id),
        }
      : undefined;

    return SqliteGoalMapper.toDomain(row, children);
  }

  private loadKeyResults(goalId: string) {
    const rows = this.db
      .prepare(
        `SELECT * FROM key_results WHERE goal_id = ? AND deleted_at IS NULL ORDER BY sort_order ASC`,
      )
      .all(goalId) as any[];

    return rows.map(SqliteGoalMapper.mapKeyResultRow);
  }

  private loadGoalReviews(goalId: string) {
    const rows = this.db
      .prepare(
        `SELECT * FROM goal_reviews WHERE goal_id = ? AND deleted_at IS NULL ORDER BY reviewed_at DESC`,
      )
      .all(goalId) as any[];

    return rows.map(SqliteGoalMapper.mapGoalReviewRow);
  }

  private loadWeightSnapshots(goalId: string) {
    const rows = this.db
      .prepare(
        `SELECT * FROM weight_snapshots WHERE goal_id = ? ORDER BY snapshot_time DESC`,
      )
      .all(goalId) as any[];

    return rows.map(SqliteGoalMapper.mapWeightSnapshotRow);
  }
}
