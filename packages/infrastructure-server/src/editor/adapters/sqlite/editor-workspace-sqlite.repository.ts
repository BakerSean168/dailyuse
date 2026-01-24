/**
 * SQLite EditorWorkspace Repository Implementation
 * 缂栬緫鍣ㄥ伐浣滃尯鐨?SQLite Repository瀹炵幇
 */

import type Database from 'better-sqlite3';
import { EditorWorkspace } from '@dailyuse/domain-server/editor';
import type { IEditorWorkspaceRepository } from '@dailyuse/domain-server/editor';

export class SqliteEditorWorkspaceRepository implements IEditorWorkspaceRepository {
  constructor(private db: Database.Database) {}

  async findByUuid(uuid: string): Promise<EditorWorkspace | null> {
    const stmt = this.db.prepare(`SELECT * FROM editor_workspaces WHERE uuid = ? LIMIT 1`);
    const row = stmt.get(uuid) as any;

    if (!row) return null;

    return EditorWorkspace.fromPersistenceDTO({
      uuid: row.uuid,
      account_uuid: row.accountUuid,
      name: row.name,
      is_active: row.is_active === 1,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }

  async findByAccountUuid(accountUuid: string): Promise<EditorWorkspace[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM editor_workspaces WHERE accountUuid = ? ORDER BY createdAt DESC`
    );
    const rows = stmt.all(accountUuid) as any[];

    return rows.map((row) =>
      EditorWorkspace.fromPersistenceDTO({
        uuid: row.uuid,
        account_uuid: row.accountUuid,
        name: row.name,
        is_active: row.is_active === 1,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })
    );
  }

  async findByAccountUuidAndName(accountUuid: string, name: string): Promise<EditorWorkspace | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM editor_workspaces WHERE accountUuid = ? AND name = ? LIMIT 1`
    );
    const row = stmt.get(accountUuid, name) as any;

    if (!row) return null;

    return EditorWorkspace.fromPersistenceDTO({
      uuid: row.uuid,
      account_uuid: row.accountUuid,
      name: row.name,
      is_active: row.is_active === 1,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }

  async findActiveByAccountUuid(accountUuid: string): Promise<EditorWorkspace | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM editor_workspaces WHERE accountUuid = ? AND is_active = 1 ORDER BY updatedAt DESC LIMIT 1`
    );
    const row = stmt.get(accountUuid) as any;

    if (!row) return null;

    return EditorWorkspace.fromPersistenceDTO({
      uuid: row.uuid,
      account_uuid: row.accountUuid,
      name: row.name,
      is_active: row.is_active === 1,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }

  async save(workspace: EditorWorkspace): Promise<void> {
    const dto = workspace.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO editor_workspaces (
        uuid, accountUuid, name, is_active, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        name = excluded.name,
        is_active = excluded.is_active,
        updatedAt = excluded.updatedAt
    `);

    stmt.run(
      dto.uuid,
      dto.accountUuid,
      dto.name,
      dto.is_active ? 1 : 0,
      dto.createdAt,
      dto.updatedAt,
    );
  }

  async delete(uuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM editor_workspaces WHERE uuid = ?`);
    stmt.run(uuid);
  }

  async saveBatch(workspaces: EditorWorkspace[]): Promise<void> {
    const insertStmt = this.db.prepare(`
      INSERT INTO editor_workspaces (
        uuid, accountUuid, name, is_active, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        name = excluded.name,
        is_active = excluded.is_active,
        updatedAt = excluded.updatedAt
    `);

    const transaction = this.db.transaction((items: EditorWorkspace[]) => {
      for (const workspace of items) {
        const dto = workspace.toPersistenceDTO();
        insertStmt.run(
          dto.uuid,
          dto.accountUuid,
          dto.name,
          dto.is_active ? 1 : 0,
          dto.createdAt,
          dto.updatedAt,
        );
      }
    });

    transaction(workspaces);
  }

  async existsByName(accountUuid: string, name: string): Promise<boolean> {
    const stmt = this.db.prepare(
      `SELECT 1 FROM editor_workspaces WHERE accountUuid = ? AND name = ? LIMIT 1`
    );
    return stmt.get(accountUuid, name) !== undefined;
  }
}

