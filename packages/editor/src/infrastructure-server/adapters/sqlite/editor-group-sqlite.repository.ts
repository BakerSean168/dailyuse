/**
 * SQLite EditorGroup Repository Implementation
 */

import type Database from 'better-sqlite3';
import { EditorGroup } from '../../../domain-server/entities/editor-group';
import type { IEditorGroupRepository } from '../../../domain-server/repositories/IEditorGroupRepository';
import { EditorGroupSqliteMapper } from './mappers/editor-group-sqlite.mapper';

export class SqliteEditorGroupRepository implements IEditorGroupRepository {
  constructor(private db: Database.Database) {}

  async findById(id: string): Promise<EditorGroup | null> {
    const stmt = this.db.prepare(`SELECT * FROM editor_groups WHERE id = ? LIMIT 1`);
    const row = stmt.get(id) as any;

    if (!row) return null;

    return EditorGroupSqliteMapper.toDomain(row);
  }

  async findBySessionId(sessionId: string): Promise<EditorGroup[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM editor_groups WHERE session_id = ? ORDER BY group_index ASC`,
    );
    const rows = stmt.all(sessionId) as any[];

    return rows.map((row) => EditorGroupSqliteMapper.toDomain(row));
  }

  async findBySessionIdAndGroupIndex(
    sessionId: string,
    groupIndex: number,
  ): Promise<EditorGroup | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM editor_groups WHERE session_id = ? AND group_index = ? LIMIT 1`,
    );
    const row = stmt.get(sessionId, groupIndex) as any;

    if (!row) return null;

    return EditorGroupSqliteMapper.toDomain(row);
  }

  async save(group: EditorGroup): Promise<void> {
    const dto = group.toServerDTO();

    const stmt = this.db.prepare(`
      INSERT INTO editor_groups (
        id, session_id, group_index, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        group_index = excluded.group_index,
        updated_at = excluded.updated_at
    `);

    stmt.run(dto.id, dto.sessionId, dto.groupIndex, dto.createdAt, dto.updatedAt);
  }

  async delete(id: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM editor_groups WHERE id = ?`);
    stmt.run(id);
  }

  async saveBatch(groups: EditorGroup[]): Promise<void> {
    const insertStmt = this.db.prepare(`
      INSERT INTO editor_groups (
        id, session_id, group_index, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        group_index = excluded.group_index,
        updated_at = excluded.updated_at
    `);

    const transaction = this.db.transaction((items: EditorGroup[]) => {
      for (const group of items) {
        const dto = group.toServerDTO();
        insertStmt.run(dto.id, dto.sessionId, dto.groupIndex, dto.createdAt, dto.updatedAt);
      }
    });

    transaction(groups);
  }

  async deleteBySessionId(sessionId: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM editor_groups WHERE session_id = ?`);
    stmt.run(sessionId);
  }

  async countBySessionId(sessionId: string): Promise<number> {
    const stmt = this.db.prepare(
      `SELECT COUNT(*) as count FROM editor_groups WHERE session_id = ?`,
    );
    const result = stmt.get(sessionId) as { count: number };
    return result.count;
  }

  async getMaxGroupIndex(sessionId: string): Promise<number> {
    const stmt = this.db.prepare(
      `SELECT MAX(group_index) as maxIndex FROM editor_groups WHERE session_id = ?`,
    );
    const result = stmt.get(sessionId) as { maxIndex: number | null };
    return result.maxIndex ?? -1;
  }
}
