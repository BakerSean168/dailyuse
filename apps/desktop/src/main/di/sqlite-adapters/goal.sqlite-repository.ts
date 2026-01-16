/**
 * SQLite Goal Repository
 *
 * 实现 IGoalRepository 接口的 SQLite 适配器
 * 遵循 DDD Repository 模式
 */

import type { IGoalRepository } from '@dailyuse/domain-server/goal';
import { Goal, KeyResult } from '@dailyuse/domain-server/goal';
import type {
  KeyResultPersistenceDTO,
  GoalStatus,
} from '@dailyuse/contracts/goal';
import type { ImportanceLevel } from '@dailyuse/contracts/shared';
import { getDatabase, transaction } from '../../database';

/**
 * Goal SQLite Repository 实现
 */
export class SqliteGoalRepository implements IGoalRepository {
  /**
   * 保存目标（创建或更新）
   */
  async save(goal: Goal): Promise<void> {
    const db = getDatabase();
    const dto = goal.toPersistenceDTO();

    transaction(() => {
      // 检查是否存在
      const existing = db
        .prepare('SELECT uuid FROM goals WHERE uuid = ?')
        .get(dto.uuid);

      if (existing) {
        // 更新
        db.prepare(`
          UPDATE goals SET
            account_uuid = ?,
            folder_uuid = ?,
            parent_goal_uuid = ?,
            title = ?,
            description = ?,
            color = ?,
            feasibility_analysis = ?,
            motivation = ?,
            status = ?,
            importance = ?,
            urgency = ?,
            category = ?,
            tags = ?,
            start_date = ?,
            target_date = ?,
            completed_at = ?,
            archived_at = ?,
            sort_order = ?,
            reminder_config = ?,
            updated_at = ?,
            deleted_at = ?
          WHERE uuid = ?
        `).run(
          dto.accountUuid,
          dto.folderUuid,
          dto.parentGoalUuid,
          dto.title,
          dto.description,
          dto.color,
          dto.feasibilityAnalysis,
          dto.motivation,
          dto.status,
          dto.importance,
          'medium',  // urgency column kept for DB compatibility
          dto.category,
          dto.tags, // 已经是 JSON string
          dto.startDate,
          dto.targetDate,
          dto.completedAt,
          dto.archivedAt,
          dto.sortOrder,
          dto.reminderConfig, // 已经是 JSON string
          dto.updatedAt,
          dto.deletedAt,
          dto.uuid
        );
      } else {
        // 插入
        db.prepare(`
          INSERT INTO goals (
            uuid, account_uuid, folder_uuid, parent_goal_uuid, title, description,
            color, feasibility_analysis, motivation, status, importance, urgency,
            category, tags, start_date, target_date, completed_at, archived_at,
            sort_order, reminder_config, created_at, updated_at, deleted_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          dto.uuid,
          dto.accountUuid,
          dto.folderUuid,
          dto.parentGoalUuid,
          dto.title,
          dto.description,
          dto.color,
          dto.feasibilityAnalysis,
          dto.motivation,
          dto.status,
          dto.importance,
          'medium',  // urgency column kept for DB compatibility, default value
          dto.category,
          dto.tags, // 已经是 JSON string
          dto.startDate,
          dto.targetDate,
          dto.completedAt,
          dto.archivedAt,
          dto.sortOrder,
          dto.reminderConfig, // 已经是 JSON string
          dto.createdAt,
          dto.updatedAt,
          dto.deletedAt
        );
      }

      // 保存 Key Results (从聚合根获取)
      this.saveKeyResultsFromGoal(goal);
    });
  }

  /**
   * 通过 UUID 查找目标
   */
  async findById(
    uuid: string,
    options?: { includeChildren?: boolean }
  ): Promise<Goal | null> {
    const db = getDatabase();
    const row = db
      .prepare('SELECT * FROM goals WHERE uuid = ? AND deleted_at IS NULL')
      .get(uuid) as GoalRow | undefined;

    if (!row) {
      return null;
    }

    const goal = this.mapToEntity(row);

    if (options?.includeChildren) {
      const keyResults = this.loadKeyResultsAsEntities(uuid);
      keyResults.forEach((kr) => goal.addKeyResult(kr));
    }

    return goal;
  }

  /**
   * 通过账户 UUID 查找所有目标
   */
  async findByAccountUuid(
    accountUuid: string,
    options?: {
      includeChildren?: boolean;
      status?: string;
      folderUuid?: string;
    }
  ): Promise<Goal[]> {
    const db = getDatabase();

    let query = 'SELECT * FROM goals WHERE account_uuid = ? AND deleted_at IS NULL';
    const params: unknown[] = [accountUuid];

    if (options?.status) {
      query += ' AND status = ?';
      params.push(options.status);
    }

    if (options?.folderUuid) {
      query += ' AND folder_uuid = ?';
      params.push(options.folderUuid);
    }

    query += ' ORDER BY sort_order ASC, created_at DESC';

    const rows = db.prepare(query).all(...params) as GoalRow[];
    const goals = rows.map((row) => this.mapToEntity(row));

    if (options?.includeChildren) {
      for (const goal of goals) {
        const keyResults = this.loadKeyResultsAsEntities(goal.uuid);
        keyResults.forEach((kr: KeyResult) => goal.addKeyResult(kr));
      }
    }

    return goals;
  }

  /**
   * 通过文件夹 UUID 查找目标
   */
  async findByFolderUuid(folderUuid: string): Promise<Goal[]> {
    const db = getDatabase();
    const rows = db
      .prepare(
        'SELECT * FROM goals WHERE folder_uuid = ? AND deleted_at IS NULL ORDER BY sort_order ASC'
      )
      .all(folderUuid) as GoalRow[];

    return rows.map((row) => this.mapToEntity(row));
  }

  /**
   * 删除目标
   */
  async delete(uuid: string): Promise<void> {
    const db = getDatabase();
    db.prepare('DELETE FROM goals WHERE uuid = ?').run(uuid);
  }

  /**
   * 软删除目标
   */
  async softDelete(uuid: string): Promise<void> {
    const db = getDatabase();
    const now = Date.now();
    db.prepare('UPDATE goals SET deleted_at = ?, updated_at = ? WHERE uuid = ?').run(
      now,
      now,
      uuid
    );
  }

  /**
   * 检查目标是否存在
   */
  async exists(uuid: string): Promise<boolean> {
    const db = getDatabase();
    const row = db
      .prepare('SELECT 1 FROM goals WHERE uuid = ? AND deleted_at IS NULL')
      .get(uuid);
    return !!row;
  }

  /**
   * 批量更新状态
   */
  async batchUpdateStatus(uuids: string[], status: string): Promise<void> {
    const db = getDatabase();
    const now = Date.now();
    const placeholders = uuids.map(() => '?').join(', ');
    db.prepare(
      `UPDATE goals SET status = ?, updated_at = ? WHERE uuid IN (${placeholders})`
    ).run(status, now, ...uuids);
  }

  /**
   * 批量移动到文件夹
   */
  async batchMoveToFolder(
    uuids: string[],
    folderUuid: string | null
  ): Promise<void> {
    const db = getDatabase();
    const now = Date.now();
    const placeholders = uuids.map(() => '?').join(', ');
    db.prepare(
      `UPDATE goals SET folder_uuid = ?, updated_at = ? WHERE uuid IN (${placeholders})`
    ).run(folderUuid, now, ...uuids);
  }

  // ========== 私有辅助方法 ==========

  /**
   * 从 Goal 聚合根保存 KeyResults
   */
  private saveKeyResultsFromGoal(goal: Goal): void {
    const db = getDatabase();
    const goalUuid = goal.uuid;
    const keyResults = goal.keyResults;

    // 删除现有的 key results
    db.prepare('DELETE FROM key_results WHERE goal_uuid = ?').run(goalUuid);

    if (!keyResults || keyResults.length === 0) {
      return;
    }

    // 插入新的
    const stmt = db.prepare(`
      INSERT INTO key_results (
        uuid, goal_uuid, title, description, progress, weight, sort_order,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const kr of keyResults) {
      const dto = kr.toPersistenceDTO();
      stmt.run(
        dto.uuid,
        dto.goalUuid,
        dto.title,
        dto.description,
        dto.progress, // JSON string
        dto.weight,
        dto.order,
        dto.createdAt,
        dto.updatedAt
      );
    }
  }

  /**
   * 加载 KeyResults 并转换为实体
   */
  private loadKeyResultsAsEntities(goalUuid: string): KeyResult[] {
    const db = getDatabase();
    const rows = db
      .prepare('SELECT * FROM key_results WHERE goal_uuid = ? ORDER BY sort_order ASC')
      .all(goalUuid) as KeyResultRow[];

    return rows.map((row) => {
      const dto: KeyResultPersistenceDTO = {
        uuid: row.uuid,
        goalUuid: row.goal_uuid,
        title: row.title,
        description: row.description,
        progress: row.progress, // JSON string
        weight: row.weight,
        order: row.sort_order,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
      return KeyResult.fromPersistenceDTO(dto);
    });
  }

  private mapToEntity(row: GoalRow): Goal {
    return Goal.fromPersistenceDTO({
      uuid: row.uuid,
      accountUuid: row.account_uuid,
      folderUuid: row.folder_uuid,
      parentGoalUuid: row.parent_goal_uuid,
      title: row.title,
      description: row.description,
      color: row.color,
      feasibilityAnalysis: row.feasibility_analysis,
      motivation: row.motivation,
      status: row.status as GoalStatus,
      importance: row.importance as ImportanceLevel,
      category: row.category,
      tags: row.tags ?? '[]',
      startDate: row.start_date,
      targetDate: row.target_date,
      completedAt: row.completed_at,
      archivedAt: row.archived_at,
      sortOrder: row.sort_order,
      reminderConfig: row.reminder_config,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
    });
  }
}

// ========== 类型定义 ==========

interface GoalRow {
  uuid: string;
  account_uuid: string;
  folder_uuid: string | null;
  parent_goal_uuid: string | null;
  title: string;
  description: string | null;
  color: string | null;
  feasibility_analysis: string | null;
  motivation: string | null;
  status: string;
  importance: string;
  category: string | null;
  tags: string | null;
  start_date: number | null;
  target_date: number | null;
  completed_at: number | null;
  archived_at: number | null;
  sort_order: number;
  reminder_config: string | null;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

interface KeyResultRow {
  uuid: string;
  goal_uuid: string;
  title: string;
  description: string | null;
  progress: string; // JSON string
  weight: number;
  sort_order: number;
  created_at: number;
  updated_at: number;
}
