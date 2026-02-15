/**
 * SQLite EditorSession Repository Implementation
 * 缂栬緫鍣ㄤ細璇濈殑 SQLite Repository瀹炵幇
 */

import type Database from 'better-sqlite3';
import { EditorSession } from '../../../domain-server/entities/editor-session';
import type { IEditorSessionRepository } from '../../../domain-server/repositories/IEditorSessionRepository';

export class SqliteEditorSessionRepository implements IEditorSessionRepository {
  constructor(private db: Database.Database) {}

  async findById(id: string): Promise<EditorSession | null> {
    const stmt = this.db.prepare(`SELECT * FROM editor_sessions WHERE uuid = ? LIMIT 1`);
    const row = stmt.get(id) as any;

    if (!row) return null;

    return this.rowToSession(row);
  }

  async findByWorkspaceId(workspaceId: string): Promise<EditorSession[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM editor_sessions WHERE workspace_uuid = ? ORDER BY createdAt DESC`
    );
    const rows = stmt.all(workspaceId) as any[];

    return rows.map((row) => this.rowToSession(row));
  }

  async findByWorkspaceIdAndName(workspaceId: string, name: string): Promise<EditorSession | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM editor_sessions WHERE workspace_uuid = ? AND name = ? LIMIT 1`
    );
    const row = stmt.get(workspaceId, name) as any;

    if (!row) return null;

    return this.rowToSession(row);
  }

  async findActiveByWorkspaceId(workspaceId: string): Promise<EditorSession | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM editor_sessions WHERE workspace_uuid = ? AND is_active = 1 ORDER BY updatedAt DESC LIMIT 1`
    );
    const row = stmt.get(workspaceId) as any;

    if (!row) return null;

    return this.rowToSession(row);
  }

  async save(session: EditorSession): Promise<void> {
    const dto = session.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO editor_sessions (
        uuid, workspace_uuid, name, is_active, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        name = excluded.name,
        is_active = excluded.is_active,
        updatedAt = excluded.updatedAt
    `);

    stmt.run(
      dto.id,
      dto.workspace_id,
      dto.name,
      dto.is_active ? 1 : 0,
      dto.createdAt,
      dto.updatedAt,
    );
  }

  async delete(id: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM editor_sessions WHERE uuid = ?`);
    stmt.run(id);
  }

  async saveBatch(sessions: EditorSession[]): Promise<void> {
    const insertStmt = this.db.prepare(`
      INSERT INTO editor_sessions (
        uuid, workspace_uuid, name, is_active, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        name = excluded.name,
        is_active = excluded.is_active,
        updatedAt = excluded.updatedAt
    `);

    const transaction = this.db.transaction((items: EditorSession[]) => {
      for (const session of items) {
        const dto = session.toPersistenceDTO();
        insertStmt.run(
          dto.id,
          dto.workspace_id,
          dto.name,
          dto.is_active ? 1 : 0,
          dto.createdAt,
          dto.updatedAt,
        );
      }
    });

    transaction(sessions);
  }

  async deleteByWorkspaceId(workspaceId: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM editor_sessions WHERE workspace_uuid = ?`);
    stmt.run(workspaceId);
  }

  async countByWorkspaceId(workspaceId: string): Promise<number> {
    const stmt = this.db.prepare(
      `SELECT COUNT(*) as count FROM editor_sessions WHERE workspace_uuid = ?`,
    );
    const result = stmt.get(workspaceId) as { count: number };
    return result.count;
  }

  async findByUuid(uuid: string): Promise<EditorSession | null> {
    return this.findById(uuid);
  }

  async findByWorkspaceUuid(workspaceUuid: string): Promise<EditorSession[]> {
    return this.findByWorkspaceId(workspaceUuid);
  }

  async findByWorkspaceUuidAndName(workspaceUuid: string, name: string): Promise<EditorSession | null> {
    return this.findByWorkspaceIdAndName(workspaceUuid, name);
  }

  async findActiveByWorkspaceUuid(workspaceUuid: string): Promise<EditorSession | null> {
    return this.findActiveByWorkspaceId(workspaceUuid);
  }

  async deleteByWorkspaceUuid(workspaceUuid: string): Promise<void> {
    await this.deleteByWorkspaceId(workspaceUuid);
  }

  private rowToSession(row: any): EditorSession {
    const layout = row.layout
      ? JSON.parse(row.layout)
      : {
          split_type: 'horizontal',
          group_count: 1,
          active_group_index: row.active_group_index ?? 0,
        };

    return EditorSession.fromPersistenceDTO({
      id: row.uuid,
      workspace_id: row.workspace_uuid,
      identityId: row.identity_id ?? row.accountUuid ?? row.account_uuid ?? row.identityId,
      name: row.name,
      description: row.description ?? null,
      groups: [],
      is_active: row.is_active === 1,
      active_group_index: row.active_group_index ?? 0,
      layout,
      lastAccessedAt: row.lastAccessedAt ?? null,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }
}

