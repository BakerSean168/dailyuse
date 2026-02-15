/**
 * SQLite EditorGroup Repository Implementation
 * 缂栬緫鍣ㄥ垎缁勭殑 SQLite Repository瀹炵幇
 */

import type Database from 'better-sqlite3';
import { EditorGroup } from '../../../domain-server/entities/editor-group';
import type { IEditorGroupRepository } from '../../../domain-server/repositories/IEditorGroupRepository';

export class SqliteEditorGroupRepository implements IEditorGroupRepository {
  constructor(private db: Database.Database) {}

  async findById(id: string): Promise<EditorGroup | null> {
    const stmt = this.db.prepare(`SELECT * FROM editor_groups WHERE uuid = ? LIMIT 1`);
    const row = stmt.get(id) as any;

    if (!row) return null;

    return EditorGroup.fromPersistenceDTO({
      id: row.uuid,
      session_id: row.session_uuid,
      workspace_id: row.workspace_id ?? row.workspaceUuid ?? row.workspace_uuid,
      identityId: row.identity_id ?? row.accountUuid ?? row.account_uuid ?? row.identityId,
      group_index: row.group_index,
      active_tab_index: row.active_tab_index ?? -1,
      name: row.name ?? null,
      tabs: [],
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }

  async findBySessionId(sessionId: string): Promise<EditorGroup[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM editor_groups WHERE session_uuid = ? ORDER BY group_index ASC`
    );
    const rows = stmt.all(sessionId) as any[];

    return rows.map((row) =>
      EditorGroup.fromPersistenceDTO({
        id: row.uuid,
        session_id: row.session_uuid,
        workspace_id: row.workspace_id ?? row.workspaceUuid ?? row.workspace_uuid,
        identityId: row.identity_id ?? row.accountUuid ?? row.account_uuid ?? row.identityId,
        group_index: row.group_index,
        active_tab_index: row.active_tab_index ?? -1,
        name: row.name ?? null,
        tabs: [],
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })
    );
  }

  async findBySessionIdAndGroupIndex(sessionId: string, groupIndex: number): Promise<EditorGroup | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM editor_groups WHERE session_uuid = ? AND group_index = ? LIMIT 1`
    );
    const row = stmt.get(sessionId, groupIndex) as any;

    if (!row) return null;

    return EditorGroup.fromPersistenceDTO({
      id: row.uuid,
      session_id: row.session_uuid,
      workspace_id: row.workspace_id ?? row.workspaceUuid ?? row.workspace_uuid,
      identityId: row.identity_id ?? row.accountUuid ?? row.account_uuid ?? row.identityId,
      group_index: row.group_index,
      active_tab_index: row.active_tab_index ?? -1,
      name: row.name ?? null,
      tabs: [],
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }

  async save(group: EditorGroup): Promise<void> {
    const dto = group.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO editor_groups (
        uuid, session_uuid, group_index, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        group_index = excluded.group_index,
        updatedAt = excluded.updatedAt
    `);

    stmt.run(
      dto.id,
      dto.session_id,
      dto.group_index,
      dto.createdAt,
      dto.updatedAt,
    );
  }

  async delete(id: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM editor_groups WHERE uuid = ?`);
    stmt.run(id);
  }

  async saveBatch(groups: EditorGroup[]): Promise<void> {
    const insertStmt = this.db.prepare(`
      INSERT INTO editor_groups (
        uuid, session_uuid, group_index, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        group_index = excluded.group_index,
        updatedAt = excluded.updatedAt
    `);

    const transaction = this.db.transaction((items: EditorGroup[]) => {
      for (const group of items) {
        const dto = group.toPersistenceDTO();
        insertStmt.run(
          dto.id,
          dto.session_id,
          dto.group_index,
          dto.createdAt,
          dto.updatedAt,
        );
      }
    });

    transaction(groups);
  }

  async deleteBySessionId(sessionId: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM editor_groups WHERE session_uuid = ?`);
    stmt.run(sessionId);
  }

  async countBySessionId(sessionId: string): Promise<number> {
    const stmt = this.db.prepare(
      `SELECT COUNT(*) as count FROM editor_groups WHERE session_uuid = ?`,
    );
    const result = stmt.get(sessionId) as { count: number };
    return result.count;
  }

  async getMaxGroupIndex(sessionId: string): Promise<number> {
    const stmt = this.db.prepare(
      `SELECT MAX(group_index) as maxIndex FROM editor_groups WHERE session_uuid = ?`,
    );
    const result = stmt.get(sessionId) as { maxIndex: number | null };
    return result.maxIndex ?? -1;
  }

  async findByUuid(uuid: string): Promise<EditorGroup | null> {
    return this.findById(uuid);
  }

  async findBySessionUuid(sessionUuid: string): Promise<EditorGroup[]> {
    return this.findBySessionId(sessionUuid);
  }

  async findBySessionUuidAndGroupIndex(sessionUuid: string, groupIndex: number): Promise<EditorGroup | null> {
    return this.findBySessionIdAndGroupIndex(sessionUuid, groupIndex);
  }

  async deleteBySessionUuid(sessionUuid: string): Promise<void> {
    await this.deleteBySessionId(sessionUuid);
  }
}

