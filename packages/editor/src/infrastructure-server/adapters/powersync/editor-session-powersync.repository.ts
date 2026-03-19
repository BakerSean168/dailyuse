import type { IElectronDatabase } from '@dailyuse/contracts/electron';
import type { IEditorSessionRepository } from '../../../domain-server/repositories/IEditorSessionRepository';
import { EditorSession } from '../../../domain-server/entities/editor-session';

type SessionRow = {
  id: string;
  workspace_id: string;
  identity_id: string;
  name: string;
  layout: string;
  is_active: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

function parseLayout(layout: string) {
  try {
    return JSON.parse(layout) as {
      splitType: string;
      groupCount: number;
      activeGroupIndex: number;
    };
  } catch {
    return { splitType: 'Horizontal', groupCount: 1, activeGroupIndex: 0 };
  }
}

function toDomain(row: SessionRow): EditorSession {
  return EditorSession.load({
    id: row.id as any,
    workspaceId: row.workspace_id as any,
    identityId: row.identity_id as any,
    name: row.name,
    description: null,
    layout: parseLayout(row.layout) as any,
    isActive: row.is_active === 1,
    activeGroupIndex: 0,
    groups: [],
    lastAccessedAt: null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  });
}

export class PowerSyncEditorSessionRepository implements IEditorSessionRepository {
  constructor(private readonly db: IElectronDatabase) {}

  async findById(id: string): Promise<EditorSession | null> {
    const row = await this.db.getOptional<SessionRow>(
      'SELECT * FROM editor_workspace_sessions WHERE id = ? AND deleted_at IS NULL LIMIT 1',
      [id],
    );
    return row ? toDomain(row) : null;
  }

  async findByWorkspaceId(workspaceId: string): Promise<EditorSession[]> {
    const rows = await this.db.getAll<SessionRow>(
      'SELECT * FROM editor_workspace_sessions WHERE workspace_id = ? AND deleted_at IS NULL ORDER BY created_at ASC',
      [workspaceId],
    );
    return rows.map(toDomain);
  }

  async findByWorkspaceIdAndName(workspaceId: string, name: string): Promise<EditorSession | null> {
    const row = await this.db.getOptional<SessionRow>(
      'SELECT * FROM editor_workspace_sessions WHERE workspace_id = ? AND name = ? AND deleted_at IS NULL LIMIT 1',
      [workspaceId, name],
    );
    return row ? toDomain(row) : null;
  }

  async findActiveByWorkspaceId(workspaceId: string): Promise<EditorSession | null> {
    const row = await this.db.getOptional<SessionRow>(
      'SELECT * FROM editor_workspace_sessions WHERE workspace_id = ? AND is_active = 1 AND deleted_at IS NULL ORDER BY updated_at DESC LIMIT 1',
      [workspaceId],
    );
    return row ? toDomain(row) : null;
  }

  async save(session: EditorSession): Promise<void> {
    const dto = session.toServerDTO();
    const existing = await this.db.getOptional<{ id: string }>(
      'SELECT id FROM editor_workspace_sessions WHERE id = ? LIMIT 1',
      [dto.id],
    );

    if (existing) {
      await this.db.execute(
        `UPDATE editor_workspace_sessions
         SET workspace_id = ?, identity_id = ?, name = ?, layout = ?, is_active = ?, updated_at = ?
         WHERE id = ?`,
        [
          dto.workspaceId,
          dto.identityId,
          dto.name,
          JSON.stringify(dto.layout),
          dto.isActive ? 1 : 0,
          new Date(dto.updatedAt).toISOString(),
          dto.id,
        ],
      );
      return;
    }

    await this.db.execute(
      `INSERT INTO editor_workspace_sessions (
         id, workspace_id, identity_id, name, layout, is_active, version, created_at, updated_at, deleted_at
       ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, NULL)`,
      [
        dto.id,
        dto.workspaceId,
        dto.identityId,
        dto.name,
        JSON.stringify(dto.layout),
        dto.isActive ? 1 : 0,
        new Date(dto.createdAt).toISOString(),
        new Date(dto.updatedAt).toISOString(),
      ],
    );
  }

  async delete(id: string): Promise<void> {
    await this.db.execute('DELETE FROM editor_workspace_sessions WHERE id = ?', [id]);
  }

  async saveBatch(sessions: EditorSession[]): Promise<void> {
    await this.db.writeTransaction(async () => {
      for (const session of sessions) {
        await this.save(session);
      }
    });
  }

  async deleteByWorkspaceId(workspaceId: string): Promise<void> {
    await this.db.execute('DELETE FROM editor_workspace_sessions WHERE workspace_id = ?', [
      workspaceId,
    ]);
  }

  async countByWorkspaceId(workspaceId: string): Promise<number> {
    const row = await this.db.getOptional<{ cnt: number }>(
      'SELECT COUNT(*) as cnt FROM editor_workspace_sessions WHERE workspace_id = ? AND deleted_at IS NULL',
      [workspaceId],
    );
    return Number(row?.cnt ?? 0);
  }
}
