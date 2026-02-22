/**
 * SQLite EditorTab Repository Implementation
 */

import type Database from 'better-sqlite3';
import { EditorTab } from '../../../domain-server/entities/editor-tab';
import { TabType } from '@dailyuse/contracts/editor';
import type { IEditorTabRepository } from '../../../domain-server/repositories/IEditorTabRepository';

export class SqliteEditorTabRepository implements IEditorTabRepository {
  constructor(private db: Database.Database) {}

  async findById(id: string): Promise<EditorTab | null> {
    const stmt = this.db.prepare(`SELECT * FROM editor_tabs WHERE id = ? LIMIT 1`);
    const row = stmt.get(id) as any;

    if (!row) return null;

    return this.rowToTab(row);
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
    const dto = tab.toServerDTO();

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
      dto.groupId,
      dto.documentId,
      dto.tabIndex,
      dto.isPinned ? 1 : 0,
      dto.isDirty ? 1 : 0,
      new Date(dto.createdAt),
      new Date(dto.updatedAt),
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
        const dto = tab.toServerDTO();
        insertStmt.run(
          dto.id,
          dto.groupId,
          dto.documentId,
          dto.tabIndex,
          dto.isPinned ? 1 : 0,
          dto.isDirty ? 1 : 0,
          new Date(dto.createdAt),
          new Date(dto.updatedAt),
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

  private rowToTab(row: any): EditorTab {
    const viewState = row.view_state
      ? JSON.parse(row.view_state)
      : { scrollTop: 0, scrollLeft: 0, cursorPosition: { line: 0, column: 0 }, selections: [] };

    return EditorTab.load({
      id: row.id,
      groupId: row.group_id,
      sessionId: row.session_id,
      workspaceId: row.workspace_id ?? row.workspaceId ?? row.workspace_id,
      identityId: row.identity_id ?? row.identityId ?? row.identity_id ?? row.identityId,
      documentId: row.document_id,
      tabIndex: row.tab_index,
      tabType: (row.tab_type ?? row.tabType ?? TabType.Document) as any,
      name: row.name ?? 'Untitled',
      viewState,
      isPinned: row.is_pinned === 1,
      isDirty: row.is_dirty === 1,
      lastAccessedAt: row.lastAccessedAt ? new Date(row.lastAccessedAt) : null,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    } as any);
  }
}

