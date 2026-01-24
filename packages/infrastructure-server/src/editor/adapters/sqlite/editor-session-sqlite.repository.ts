/**
 * SQLite EditorSession Repository Implementation
 * 缂栬緫鍣ㄤ細璇濈殑 SQLite 浠撳偍瀹炵幇
 */

import type Database from 'better-sqlite3';
import { EditorSession } from '@dailyuse/domain-server/editor';
import type { IEditorSessionRepository } from '@dailyuse/domain-server/editor';

export class SqliteEditorSessionRepository implements IEditorSessionRepository {
  constructor(private db: Database.Database) {}

  async findByUuid(uuid: string): Promise<EditorSession | null> {
    const stmt = this.db.prepare(`SELECT * FROM editor_sessions WHERE uuid = ? LIMIT 1`);
    const row = stmt.get(uuid) as any;

    if (!row) return null;

    return EditorSession.fromPersistenceDTO({
      uuid: row.uuid,
      workspace_uuid: row.workspace_uuid,
      name: row.name,
      is_active: row.is_active === 1,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }

  async findByWorkspaceUuid(workspaceUuid: string): Promise<EditorSession[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM editor_sessions WHERE workspace_uuid = ? ORDER BY createdAt DESC`
    );
    const rows = stmt.all(workspaceUuid) as any[];

    return rows.map((row) =>
      EditorSession.fromPersistenceDTO({
        uuid: row.uuid,
        workspace_uuid: row.workspace_uuid,
        name: row.name,
        is_active: row.is_active === 1,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })
    );
  }

  async findByWorkspaceUuidAndName(workspaceUuid: string, name: string): Promise<EditorSession | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM editor_sessions WHERE workspace_uuid = ? AND name = ? LIMIT 1`
    );
    const row = stmt.get(workspaceUuid, name) as any;

    if (!row) return null;

    return EditorSession.fromPersistenceDTO({
      uuid: row.uuid,
      workspace_uuid: row.workspace_uuid,
      name: row.name,
      is_active: row.is_active === 1,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }

  async findActiveByWorkspaceUuid(workspaceUuid: string): Promise<EditorSession | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM editor_sessions WHERE workspace_uuid = ? AND is_active = 1 ORDER BY updatedAt DESC LIMIT 1`
    );
    const row = stmt.get(workspaceUuid) as any;

    if (!row) return null;

    return EditorSession.fromPersistenceDTO({
      uuid: row.uuid,
      workspace_uuid: row.workspace_uuid,
      name: row.name,
      is_active: row.is_active === 1,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
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
      dto.uuid,
      dto.workspace_uuid,
      dto.name,
      dto.is_active ? 1 : 0,
      dto.createdAt,
      dto.updatedAt,
    );
  }

  async delete(uuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM editor_sessions WHERE uuid = ?`);
    stmt.run(uuid);
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
          dto.uuid,
          dto.workspace_uuid,
          dto.name,
          dto.is_active ? 1 : 0,
          dto.createdAt,
          dto.updatedAt,
        );
      }
    });

    transaction(sessions);
  }

  async deleteByWorkspaceUuid(workspaceUuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM editor_sessions WHERE workspace_uuid = ?`);
    stmt.run(workspaceUuid);
  }
}

