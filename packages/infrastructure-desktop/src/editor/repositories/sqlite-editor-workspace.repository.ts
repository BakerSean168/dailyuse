/**
 * SQLite EditorWorkspace Repository Implementation
 * 编辑器工作区的 SQLite 仓储实现
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
      account_uuid: row.account_uuid,
      name: row.name,
      is_active: row.is_active === 1,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    });
  }

  async findByAccountUuid(accountUuid: string): Promise<EditorWorkspace[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM editor_workspaces WHERE account_uuid = ? ORDER BY created_at DESC`
    );
    const rows = stmt.all(accountUuid) as any[];

    return rows.map((row) =>
      EditorWorkspace.fromPersistenceDTO({
        uuid: row.uuid,
        account_uuid: row.account_uuid,
        name: row.name,
        is_active: row.is_active === 1,
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at),
      })
    );
  }

  async findByAccountUuidAndName(accountUuid: string, name: string): Promise<EditorWorkspace | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM editor_workspaces WHERE account_uuid = ? AND name = ? LIMIT 1`
    );
    const row = stmt.get(accountUuid, name) as any;

    if (!row) return null;

    return EditorWorkspace.fromPersistenceDTO({
      uuid: row.uuid,
      account_uuid: row.account_uuid,
      name: row.name,
      is_active: row.is_active === 1,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    });
  }

  async findActiveByAccountUuid(accountUuid: string): Promise<EditorWorkspace | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM editor_workspaces WHERE account_uuid = ? AND is_active = 1 ORDER BY updated_at DESC LIMIT 1`
    );
    const row = stmt.get(accountUuid) as any;

    if (!row) return null;

    return EditorWorkspace.fromPersistenceDTO({
      uuid: row.uuid,
      account_uuid: row.account_uuid,
      name: row.name,
      is_active: row.is_active === 1,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    });
  }

  async save(workspace: EditorWorkspace): Promise<void> {
    const dto = workspace.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO editor_workspaces (
        uuid, account_uuid, name, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        name = excluded.name,
        is_active = excluded.is_active,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      dto.uuid,
      dto.account_uuid,
      dto.name,
      dto.is_active ? 1 : 0,
      dto.created_at,
      dto.updated_at,
    );
  }

  async delete(uuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM editor_workspaces WHERE uuid = ?`);
    stmt.run(uuid);
  }

  async saveBatch(workspaces: EditorWorkspace[]): Promise<void> {
    const insertStmt = this.db.prepare(`
      INSERT INTO editor_workspaces (
        uuid, account_uuid, name, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        name = excluded.name,
        is_active = excluded.is_active,
        updated_at = excluded.updated_at
    `);

    const transaction = this.db.transaction((items: EditorWorkspace[]) => {
      for (const workspace of items) {
        const dto = workspace.toPersistenceDTO();
        insertStmt.run(
          dto.uuid,
          dto.account_uuid,
          dto.name,
          dto.is_active ? 1 : 0,
          dto.created_at,
          dto.updated_at,
        );
      }
    });

    transaction(workspaces);
  }

  async existsByName(accountUuid: string, name: string): Promise<boolean> {
    const stmt = this.db.prepare(
      `SELECT 1 FROM editor_workspaces WHERE account_uuid = ? AND name = ? LIMIT 1`
    );
    return stmt.get(accountUuid, name) !== undefined;
  }
}
