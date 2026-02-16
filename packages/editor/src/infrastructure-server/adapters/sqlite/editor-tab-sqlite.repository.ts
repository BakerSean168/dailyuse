/**
 * SQLite EditorTab Repository Implementation
 * 缂栬緫鍣ㄦ爣绛剧殑 SQLite Repository瀹炵幇
 */

import type Database from 'better-sqlite3';
import { EditorTab } from '../../../domain-server/entities/editor-tab';
import type { IEditorTabRepository } from '../../../domain-server/repositories/IEditorTabRepository';

export class SqliteEditorTabRepository implements IEditorTabRepository {
  constructor(private db: Database.Database) {}

  async findById(id: string): Promise<EditorTab | null> {
    const stmt = this.db.prepare(`SELECT * FROM editor_tabs WHERE id = ? LIMIT 1`);
    const row = stmt.get(id) as any;

    if (!row) return null;

    return EditorTab.fromPersistenceDTO({
      id: row.id,
      group_id: row.group_id,
      session_id: row.session_id,
      workspace_id: row.workspace_id ?? row.workspaceId ?? row.workspace_id,
      identityId: row.identity_id ?? row.identityId ?? row.identity_id ?? row.identityId,
      document_id: row.document_id,
      tab_index: row.tab_index,
      tab_type: row.tab_type ?? row.tabType ?? 'Document',
      name: row.name ?? 'Untitled',
      view_state: row.view_state ?? JSON.stringify({
        scrollTop: 0,
        scrollLeft: 0,
        cursorPosition: { line: 0, column: 0 },
        selections: [],
      }),
      is_pinned: row.is_pinned === 1,
      is_dirty: row.is_dirty === 1,
      lastAccessedAt: row.lastAccessedAt ?? null,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }

  async findByGroupId(groupId: string): Promise<EditorTab[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM editor_tabs WHERE group_id = ? ORDER BY tab_index ASC`
    );
    const rows = stmt.all(groupId) as any[];

    return rows.map((row) => this.rowToTab(row));
  }

  async findByDocumentId(documentId: string): Promise<EditorTab[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM editor_tabs WHERE document_id = ? ORDER BY createdAt DESC`
    );
    const rows = stmt.all(documentId) as any[];

    return rows.map((row) => this.rowToTab(row));
  }

  async findByGroupIdAndTabIndex(groupId: string, tabIndex: number): Promise<EditorTab | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM editor_tabs WHERE group_id = ? AND tab_index = ? LIMIT 1`
    );
    const row = stmt.get(groupId, tabIndex) as any;

    if (!row) return null;

    return this.rowToTab(row);
  }

  async findPinnedByGroupId(groupId: string): Promise<EditorTab[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM editor_tabs WHERE group_id = ? AND is_pinned = 1 ORDER BY tab_index ASC`
    );
    const rows = stmt.all(groupId) as any[];

    return rows.map((row) => this.rowToTab(row));
  }

  async findDirtyByGroupId(groupId: string): Promise<EditorTab[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM editor_tabs WHERE group_id = ? AND is_dirty = 1 ORDER BY updatedAt DESC`
    );
    const rows = stmt.all(groupId) as any[];

    return rows.map((row) => this.rowToTab(row));
  }

  async findRecentlyAccessed(groupId: string, limit: number): Promise<EditorTab[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM editor_tabs WHERE group_id = ? ORDER BY updatedAt DESC LIMIT ?`
    );
    const rows = stmt.all(groupId, limit) as any[];

    return rows.map((row) => this.rowToTab(row));
  }

  async save(tab: EditorTab): Promise<void> {
    const dto = tab.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO editor_tabs (
        id, group_id, document_id, tab_index, is_pinned, is_dirty,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        tab_index = excluded.tab_index,
        is_pinned = excluded.is_pinned,
        is_dirty = excluded.is_dirty,
        updatedAt = excluded.updatedAt
    `);

    stmt.run(
      dto.id,
      dto.group_id,
      dto.document_id,
      dto.tab_index,
      dto.is_pinned ? 1 : 0,
      dto.is_dirty ? 1 : 0,
      dto.createdAt,
      dto.updatedAt,
    );
  }

  async delete(id: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM editor_tabs WHERE id = ?`);
    stmt.run(id);
  }

  async saveBatch(tabs: EditorTab[]): Promise<void> {
    const insertStmt = this.db.prepare(`
      INSERT INTO editor_tabs (
        id, group_id, document_id, tab_index, is_pinned, is_dirty,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        tab_index = excluded.tab_index,
        is_pinned = excluded.is_pinned,
        is_dirty = excluded.is_dirty,
        updatedAt = excluded.updatedAt
    `);

    const transaction = this.db.transaction((items: EditorTab[]) => {
      for (const tab of items) {
        const dto = tab.toPersistenceDTO();
        insertStmt.run(
          dto.id,
          dto.group_id,
          dto.document_id,
          dto.tab_index,
          dto.is_pinned ? 1 : 0,
          dto.is_dirty ? 1 : 0,
          dto.createdAt,
          dto.updatedAt,
        );
      }
    });

    transaction(tabs);
  }

  async deleteByGroupId(groupId: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM editor_tabs WHERE group_id = ?`);
    stmt.run(groupId);
  }

  async deleteByDocumentId(documentId: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM editor_tabs WHERE document_id = ?`);
    stmt.run(documentId);
  }

  async countByGroupId(groupId: string): Promise<number> {
    const stmt = this.db.prepare(
      `SELECT COUNT(*) as count FROM editor_tabs WHERE group_id = ?`,
    );
    const result = stmt.get(groupId) as { count: number };
    return result.count;
  }

  async countDirtyByGroupId(groupId: string): Promise<number> {
    const stmt = this.db.prepare(
      `SELECT COUNT(*) as count FROM editor_tabs WHERE group_id = ? AND is_dirty = 1`,
    );
    const result = stmt.get(groupId) as { count: number };
    return result.count;
  }

  async getMaxTabIndex(groupId: string): Promise<number> {
    const stmt = this.db.prepare(
      `SELECT MAX(tab_index) as maxIndex FROM editor_tabs WHERE group_id = ?`,
    );
    const result = stmt.get(groupId) as { maxIndex: number | null };
    return result.maxIndex ?? -1;
  }

  async findById(id: string): Promise<EditorTab | null> {
    return this.findById(id);
  }

  async findByGroupId(groupId: string): Promise<EditorTab[]> {
    return this.findByGroupId(groupId);
  }

  async findByDocumentId(documentId: string): Promise<EditorTab[]> {
    return this.findByDocumentId(documentId);
  }

  async findByGroupIdAndTabIndex(groupId: string, tabIndex: number): Promise<EditorTab | null> {
    return this.findByGroupIdAndTabIndex(groupId, tabIndex);
  }

  async findPinnedByGroupId(groupId: string): Promise<EditorTab[]> {
    return this.findPinnedByGroupId(groupId);
  }

  async findDirtyByGroupId(groupId: string): Promise<EditorTab[]> {
    return this.findDirtyByGroupId(groupId);
  }

  private rowToTab(row: any): EditorTab {
    return EditorTab.fromPersistenceDTO({
      id: row.id,
      group_id: row.group_id,
      session_id: row.session_id,
      workspace_id: row.workspace_id ?? row.workspaceId ?? row.workspace_id,
      identityId: row.identity_id ?? row.identityId ?? row.identity_id ?? row.identityId,
      document_id: row.document_id,
      tab_index: row.tab_index,
      tab_type: row.tab_type ?? row.tabType ?? 'Document',
      name: row.name ?? 'Untitled',
      view_state: row.view_state ?? JSON.stringify({
        scrollTop: 0,
        scrollLeft: 0,
        cursorPosition: { line: 0, column: 0 },
        selections: [],
      }),
      is_pinned: row.is_pinned === 1,
      is_dirty: row.is_dirty === 1,
      lastAccessedAt: row.lastAccessedAt ?? null,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }
}

