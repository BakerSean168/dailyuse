/**
 * SQLite EditorWorkspace Repository Implementation
 */

import type Database from 'better-sqlite3';
import { EditorWorkspace } from '../../../domain-server/aggregates/editor-workspace';
import type { IEditorWorkspaceRepository } from '../../../domain-server/repositories/IEditorWorkspaceRepository';
import { EditorWorkspaceId } from '../../../domain-shared';
import { WorkspaceLayout } from '../../../domain-shared/value-objects/workspace-layout';
import { WorkspaceSettings } from '../../../domain-shared/value-objects/workspace-settings';
import { ProjectType } from '@dailyuse/contracts/editor';

export class SqliteEditorWorkspaceRepository implements IEditorWorkspaceRepository {
  constructor(private db: Database.Database) {}

  async findById(id: string): Promise<EditorWorkspace | null> {
    const stmt = this.db.prepare(`SELECT * FROM editor_workspaces WHERE id = ? LIMIT 1`);
    const row = stmt.get(id) as any;

    if (!row) return null;

    return this.rowToWorkspace(row);
  }

  async findByIdentityId(identityId: string): Promise<EditorWorkspace[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM editor_workspaces WHERE identityId = ? ORDER BY createdAt DESC`
    );
    const rows = stmt.all(identityId) as any[];

    return rows.map((row) => this.rowToWorkspace(row));
  }

  async findByIdentityIdAndName(identityId: string, name: string): Promise<EditorWorkspace | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM editor_workspaces WHERE identityId = ? AND name = ? LIMIT 1`
    );
    const row = stmt.get(identityId, name) as any;

    if (!row) return null;

    return this.rowToWorkspace(row);
  }

  async findActiveByIdentityId(identityId: string): Promise<EditorWorkspace | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM editor_workspaces WHERE identityId = ? AND is_active = 1 ORDER BY updatedAt DESC LIMIT 1`
    );
    const row = stmt.get(identityId) as any;

    if (!row) return null;

    return this.rowToWorkspace(row);
  }

  async save(workspace: EditorWorkspace): Promise<void> {
    const dto = workspace.toServerDTO();

    const stmt = this.db.prepare(`
      INSERT INTO editor_workspaces (
        id, identityId, name, is_active, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        is_active = excluded.is_active,
        updatedAt = excluded.updatedAt
    `);

    stmt.run(
      dto.id,
      dto.identityId,
      dto.name,
      dto.isActive ? 1 : 0,
      new Date(dto.createdAt),
      new Date(dto.updatedAt),
    );
  }

  async delete(id: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM editor_workspaces WHERE id = ?`);
    stmt.run(id);
  }

  async saveBatch(workspaces: EditorWorkspace[]): Promise<void> {
    const insertStmt = this.db.prepare(`
      INSERT INTO editor_workspaces (
        id, identityId, name, is_active, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        is_active = excluded.is_active,
        updatedAt = excluded.updatedAt
    `);

    const transaction = this.db.transaction((items: EditorWorkspace[]) => {
      for (const workspace of items) {
        const dto = workspace.toServerDTO();
        insertStmt.run(
          dto.id,
          dto.identityId,
          dto.name,
          dto.isActive ? 1 : 0,
          new Date(dto.createdAt),
          new Date(dto.updatedAt),
        );
      }
    });

    transaction(workspaces);
  }

  async existsByName(identityId: string, name: string): Promise<boolean> {
    const stmt = this.db.prepare(
      `SELECT 1 FROM editor_workspaces WHERE identityId = ? AND name = ? LIMIT 1`
    );
    return stmt.get(identityId, name) !== undefined;
  }

  async countByIdentityId(identityId: string): Promise<number> {
    const stmt = this.db.prepare(
      `SELECT COUNT(*) as count FROM editor_workspaces WHERE identityId = ?`
    );
    const result = stmt.get(identityId) as { count: number };
    return result.count;
  }

  private rowToWorkspace(row: any): EditorWorkspace {
    const layoutData = row.layout
      ? (typeof row.layout === 'string' ? JSON.parse(row.layout) : row.layout)
      : WorkspaceLayout.createDefault().toServerDTO();
    const settingsData = row.settings
      ? (typeof row.settings === 'string' ? JSON.parse(row.settings) : row.settings)
      : WorkspaceSettings.createDefault().toServerDTO();

    return EditorWorkspace.load({
      id: EditorWorkspaceId.of(row.id),
      identityId: row.identityId,
      name: row.name,
      description: row.description ?? null,
      projectPath: row.project_path ?? row.projectPath ?? '',
      projectType: (row.project_type ?? row.projectType ?? ProjectType.Other) as ProjectType,
      layout: WorkspaceLayout.fromDTO(layoutData),
      settings: WorkspaceSettings.fromDTO(settingsData),
      isActive: row.is_active === 1,
      lastActiveSessionId: row.last_active_session_id ?? null,
      lastAccessedAt: row.lastAccessedAt ? new Date(row.lastAccessedAt) : null,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      sessions: [],
    } as any);
  }
}
