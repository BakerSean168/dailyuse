/**
 * SQLite EditorWorkspace Repository Implementation
 */

import type Database from 'better-sqlite3';
import type { IEditorWorkspaceRepository } from '../../../domain-server/repositories/IEditorWorkspaceRepository';
import { EditorWorkspace } from '../../../domain-server/aggregates/editor-workspace';
import { EditorWorkspaceSqliteMapper } from './mappers/editor-workspace-sqlite.mapper';

export class SqliteEditorWorkspaceRepository implements IEditorWorkspaceRepository {
  constructor(private db: Database.Database) {}

  async findById(id: string): Promise<EditorWorkspace | null> {
    const stmt = this.db.prepare(`SELECT * FROM editor_workspaces WHERE id = ? LIMIT 1`);
    const row = stmt.get(id) as any;

    if (!row) return null;

    return EditorWorkspaceSqliteMapper.toDomain(row);
  }

  async findByIdentityId(identityId: string): Promise<EditorWorkspace[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM editor_workspaces WHERE identity_id = ? ORDER BY created_at DESC`,
    );
    const rows = stmt.all(identityId) as any[];

    return rows.map((row) => EditorWorkspaceSqliteMapper.toDomain(row));
  }

  async findByIdentityIdAndName(identityId: string, name: string): Promise<EditorWorkspace | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM editor_workspaces WHERE identity_id = ? AND name = ? LIMIT 1`,
    );
    const row = stmt.get(identityId, name) as any;

    if (!row) return null;

    return EditorWorkspaceSqliteMapper.toDomain(row);
  }

  async findActiveByIdentityId(identityId: string): Promise<EditorWorkspace | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM editor_workspaces WHERE identity_id = ? AND is_active = 1 ORDER BY updated_at DESC LIMIT 1`,
    );
    const row = stmt.get(identityId) as any;

    if (!row) return null;

    return EditorWorkspaceSqliteMapper.toDomain(row);
  }

  async save(workspace: EditorWorkspace): Promise<void> {
    const dto = workspace.toServerDTO();

    const stmt = this.db.prepare(`
      INSERT INTO editor_workspaces (
        id, identity_id, name, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        is_active = excluded.is_active,
        updated_at = excluded.updated_at
    `);

    stmt.run(dto.id, dto.identityId, dto.name, dto.isActive ? 1 : 0, dto.createdAt, dto.updatedAt);
  }

  async delete(id: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM editor_workspaces WHERE id = ?`);
    stmt.run(id);
  }

  async saveBatch(workspaces: EditorWorkspace[]): Promise<void> {
    const insertStmt = this.db.prepare(`
      INSERT INTO editor_workspaces (
        id, identity_id, name, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        is_active = excluded.is_active,
        updated_at = excluded.updated_at
    `);

    const transaction = this.db.transaction((items: EditorWorkspace[]) => {
      for (const workspace of items) {
        const dto = workspace.toServerDTO();
        insertStmt.run(
          dto.id,
          dto.identityId,
          dto.name,
          dto.isActive ? 1 : 0,
          dto.createdAt,
          dto.updatedAt,
        );
      }
    });

    transaction(workspaces);
  }

  async existsByName(identityId: string, name: string): Promise<boolean> {
    const stmt = this.db.prepare(
      `SELECT 1 FROM editor_workspaces WHERE identity_id = ? AND name = ? LIMIT 1`,
    );
    return stmt.get(identityId, name) !== undefined;
  }

  async countByIdentityId(identityId: string): Promise<number> {
    const stmt = this.db.prepare(
      `SELECT COUNT(*) as count FROM editor_workspaces WHERE identity_id = ?`,
    );
    const result = stmt.get(identityId) as { count: number };
    return result.count;
  }
}
