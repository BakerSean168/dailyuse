/**
 * SQLite EditorWorkspace Repository Implementation
 * 缂栬緫鍣ㄥ伐浣滃尯鐨?SQLite Repository瀹炵幇
 */

import type Database from 'better-sqlite3';
import { EditorWorkspace } from '../../../domain-server/aggregates/editor-workspace';
import type { IEditorWorkspaceRepository } from '../../../domain-server/repositories/IEditorWorkspaceRepository';
import { WorkspaceLayout } from '../../../domain-shared/value-objects/workspace-layout';
import { WorkspaceSettings } from '../../../domain-shared/value-objects/workspace-settings';
import { ProjectType } from '@dailyuse/contracts/editor';

export class SqliteEditorWorkspaceRepository implements IEditorWorkspaceRepository {
  constructor(private db: Database.Database) {}

  async findById(id: string): Promise<EditorWorkspace | null> {
    const stmt = this.db.prepare(`SELECT * FROM editor_workspaces WHERE uuid = ? LIMIT 1`);
    const row = stmt.get(id) as any;

    if (!row) return null;

    return EditorWorkspace.fromPersistenceDTO({
      id: row.uuid,
      identityId: row.accountUuid,
      name: row.name,
      description: row.description ?? null,
      project_path: row.project_path ?? row.projectPath ?? '',
      project_type: row.project_type ?? row.projectType ?? ProjectType.Other,
      layout: row.layout ?? JSON.stringify(WorkspaceLayout.createDefault().toServerDTO()),
      settings: row.settings ?? JSON.stringify(WorkspaceSettings.createDefault().toServerDTO()),
      is_active: row.is_active === 1,
      last_active_session_id: row.last_active_session_id ?? null,
      lastAccessedAt: row.lastAccessedAt ?? null,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }

  async findByIdentityId(identityId: string): Promise<EditorWorkspace[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM editor_workspaces WHERE accountUuid = ? ORDER BY createdAt DESC`
    );
    const rows = stmt.all(identityId) as any[];

    return rows.map((row) =>
      EditorWorkspace.fromPersistenceDTO({
        id: row.uuid,
        identityId: row.accountUuid,
        name: row.name,
        description: row.description ?? null,
        project_path: row.project_path ?? row.projectPath ?? '',
        project_type: row.project_type ?? row.projectType ?? ProjectType.Other,
        layout: row.layout ?? JSON.stringify(WorkspaceLayout.createDefault().toServerDTO()),
        settings: row.settings ?? JSON.stringify(WorkspaceSettings.createDefault().toServerDTO()),
        is_active: row.is_active === 1,
        last_active_session_id: row.last_active_session_id ?? null,
        lastAccessedAt: row.lastAccessedAt ?? null,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })
    );
  }

  async findByIdentityIdAndName(identityId: string, name: string): Promise<EditorWorkspace | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM editor_workspaces WHERE accountUuid = ? AND name = ? LIMIT 1`
    );
    const row = stmt.get(identityId, name) as any;

    if (!row) return null;

    return EditorWorkspace.fromPersistenceDTO({
      id: row.uuid,
      identityId: row.accountUuid,
      name: row.name,
      description: row.description ?? null,
      project_path: row.project_path ?? row.projectPath ?? '',
      project_type: row.project_type ?? row.projectType ?? ProjectType.Other,
      layout: row.layout ?? JSON.stringify(WorkspaceLayout.createDefault().toServerDTO()),
      settings: row.settings ?? JSON.stringify(WorkspaceSettings.createDefault().toServerDTO()),
      is_active: row.is_active === 1,
      last_active_session_id: row.last_active_session_id ?? null,
      lastAccessedAt: row.lastAccessedAt ?? null,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }

  async findActiveByIdentityId(identityId: string): Promise<EditorWorkspace | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM editor_workspaces WHERE accountUuid = ? AND is_active = 1 ORDER BY updatedAt DESC LIMIT 1`
    );
    const row = stmt.get(identityId) as any;

    if (!row) return null;

    return EditorWorkspace.fromPersistenceDTO({
      id: row.uuid,
      identityId: row.accountUuid,
      name: row.name,
      description: row.description ?? null,
      project_path: row.project_path ?? row.projectPath ?? '',
      project_type: row.project_type ?? row.projectType ?? ProjectType.Other,
      layout: row.layout ?? JSON.stringify(WorkspaceLayout.createDefault().toServerDTO()),
      settings: row.settings ?? JSON.stringify(WorkspaceSettings.createDefault().toServerDTO()),
      is_active: row.is_active === 1,
      last_active_session_id: row.last_active_session_id ?? null,
      lastAccessedAt: row.lastAccessedAt ?? null,
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
      dto.id,
      dto.identityId,
      dto.name,
      dto.is_active ? 1 : 0,
      dto.createdAt,
      dto.updatedAt,
    );
  }

  async delete(id: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM editor_workspaces WHERE uuid = ?`);
    stmt.run(id);
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
          dto.id,
          dto.identityId,
          dto.name,
          dto.is_active ? 1 : 0,
          dto.createdAt,
          dto.updatedAt,
        );
      }
    });

    transaction(workspaces);
  }

  async existsByName(identityId: string, name: string): Promise<boolean> {
    const stmt = this.db.prepare(
      `SELECT 1 FROM editor_workspaces WHERE accountUuid = ? AND name = ? LIMIT 1`
    );
    return stmt.get(identityId, name) !== undefined;
  }

  async countByIdentityId(identityId: string): Promise<number> {
    const stmt = this.db.prepare(
      `SELECT COUNT(*) as count FROM editor_workspaces WHERE accountUuid = ?`
    );
    const result = stmt.get(identityId) as { count: number };
    return result.count;
  }
}
