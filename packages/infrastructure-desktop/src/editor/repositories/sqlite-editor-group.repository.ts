/**
 * SQLite EditorGroup Repository Implementation
 * 编辑器分组的 SQLite 仓储实现
 */

import type Database from 'better-sqlite3';
import { EditorGroup } from '@dailyuse/domain-server/editor';
import type { IEditorGroupRepository } from '@dailyuse/domain-server/editor';

export class SqliteEditorGroupRepository implements IEditorGroupRepository {
  constructor(private db: Database.Database) {}

  async findByUuid(uuid: string): Promise<EditorGroup | null> {
    const stmt = this.db.prepare(`SELECT * FROM editor_groups WHERE uuid = ? LIMIT 1`);
    const row = stmt.get(uuid) as any;

    if (!row) return null;

    return EditorGroup.fromPersistenceDTO({
      uuid: row.uuid,
      session_uuid: row.session_uuid,
      group_index: row.group_index,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    });
  }

  async findBySessionUuid(sessionUuid: string): Promise<EditorGroup[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM editor_groups WHERE session_uuid = ? ORDER BY group_index ASC`
    );
    const rows = stmt.all(sessionUuid) as any[];

    return rows.map((row) =>
      EditorGroup.fromPersistenceDTO({
        uuid: row.uuid,
        session_uuid: row.session_uuid,
        group_index: row.group_index,
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at),
      })
    );
  }

  async findBySessionUuidAndGroupIndex(sessionUuid: string, groupIndex: number): Promise<EditorGroup | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM editor_groups WHERE session_uuid = ? AND group_index = ? LIMIT 1`
    );
    const row = stmt.get(sessionUuid, groupIndex) as any;

    if (!row) return null;

    return EditorGroup.fromPersistenceDTO({
      uuid: row.uuid,
      session_uuid: row.session_uuid,
      group_index: row.group_index,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    });
  }

  async save(group: EditorGroup): Promise<void> {
    const dto = group.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO editor_groups (
        uuid, session_uuid, group_index, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        group_index = excluded.group_index,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      dto.uuid,
      dto.session_uuid,
      dto.group_index,
      dto.created_at,
      dto.updated_at,
    );
  }

  async delete(uuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM editor_groups WHERE uuid = ?`);
    stmt.run(uuid);
  }

  async saveBatch(groups: EditorGroup[]): Promise<void> {
    const insertStmt = this.db.prepare(`
      INSERT INTO editor_groups (
        uuid, session_uuid, group_index, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        group_index = excluded.group_index,
        updated_at = excluded.updated_at
    `);

    const transaction = this.db.transaction((items: EditorGroup[]) => {
      for (const group of items) {
        const dto = group.toPersistenceDTO();
        insertStmt.run(
          dto.uuid,
          dto.session_uuid,
          dto.group_index,
          dto.created_at,
          dto.updated_at,
        );
      }
    });

    transaction(groups);
  }

  async deleteBySessionUuid(sessionUuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM editor_groups WHERE session_uuid = ?`);
    stmt.run(sessionUuid);
  }
}
