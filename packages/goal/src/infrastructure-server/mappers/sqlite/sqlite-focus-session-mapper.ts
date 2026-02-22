/**
 * SQLite FocusSession Mapper
 *
 * Maps between FocusSession domain aggregate and SQLite row.
 * SQLite 存储日期为 INTEGER（毫秒时间戳）
 */

import type { FocusSessionPersistenceDTO } from '@dailyuse/contracts/goal';
import { FocusSession } from '@/domain-server';

/**
 * SqliteFocusSessionMapper
 * 
 * 实现 SQLite 行 ↔ FocusSession 领域聚合根 的双向映射
 */
export class SqliteFocusSessionMapper {
  /**
   * SQLite row → FocusSession 聚合根
   */
  static toDomain(row: any): FocusSession {
    const dto = SqliteFocusSessionMapper.toPersistenceDTO(row);
    return FocusSession.fromPersistenceDTO(dto);
  }

  /**
   * SQLite row → FocusSessionPersistenceDTO
   */
  static toPersistenceDTO(row: any): FocusSessionPersistenceDTO {
    return {
      id: row.id,
      identityId: row.identity_id,
      goalId: row.goal_id ?? null,
      status: row.status,
      durationMinutes: row.duration_minutes,
      actualDurationMinutes: row.actual_duration_minutes ?? 0,
      description: row.description ?? null,
      startedAt: row.started_at ? new Date(row.started_at) : null,
      pausedAt: row.paused_at ? new Date(row.paused_at) : null,
      resumedAt: row.resumed_at ? new Date(row.resumed_at) : null,
      completedAt: row.completed_at ? new Date(row.completed_at) : null,
      cancelledAt: row.cancelled_at ? new Date(row.cancelled_at) : null,
      pauseCount: row.pause_count ?? 0,
      pausedDurationMinutes: row.paused_duration_minutes ?? 0,
      version: row.version ?? 1,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
    };
  }

  /**
   * Batch conversion: SQLite rows → Domain
   */
  static toDomainList(rows: any[]): FocusSession[] {
    return rows.map((row) => SqliteFocusSessionMapper.toDomain(row));
  }
}
