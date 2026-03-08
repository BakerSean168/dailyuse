/**
 * SQLite EditorTab Repository Implementation
 */

import type Database from 'better-sqlite3';
import { EditorTab } from '../../../domain-server/entities/editor-tab';
import type { IEditorTabRepository } from '../../../domain-server/repositories/IEditorTabRepository';
import { EditorTabSqliteMapper } from './mappers/editor-tab-sqlite.mapper';

export class SqliteEditorTabRepository implements IEditorTabRepository {
  constructor(private db: Database.Database) {}

  async findById(id: string): Promise<EditorTab | null> {
    const stmt = this.db.prepare(`SELECT * FROM editor_tabs WHERE id = ? LIMIT 1`);
    const row = stmt.get(id) as any;

    if (!row) return null;

    return EditorTabSqliteMapper.toDomain(row);
  }

  async findByGroupId(groupId: string): Promise<EditorTab[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM editor_tabs WHERE group_id = ? ORDER BY tab_index ASC`,
    );
    const rows = stmt.all(groupId) as any[];

    return rows.map((row) => EditorTabSqliteMapper.toDomain(row));
  }

  async findByDocumentId(documentId: string): Promise<EditorTab[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM editor_tabs WHERE document_id = ? ORDER BY created_at DESC`,
    );
    const rows = stmt.all(documentId) as any[];

    return rows.map((row) => EditorTabSqliteMapper.toDomain(row));
  }

  async findByGroupIdAndTabIndex(groupId: string, tabIndex: number): Promise<EditorTab | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM editor_tabs WHERE group_id = ? AND tab_index = ? LIMIT 1`,
    );
    const row = stmt.get(groupId, tabIndex) as any;

    if (!row) return null;

    return EditorTabSqliteMapper.toDomain(row);
  }

  async findPinnedByGroupId(groupId: string): Promise<EditorTab[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM editor_tabs WHERE group_id = ? AND is_pinned = 1 ORDER BY tab_index ASC`,
    );
    const rows = stmt.all(groupId) as any[];

    return rows.map((row) => EditorTabSqliteMapper.toDomain(row));
  }

  async findDirtyByGroupId(groupId: string): Promise<EditorTab[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM editor_tabs WHERE group_id = ? AND is_dirty = 1 ORDER BY updated_at DESC`,
    );
    const rows = stmt.all(groupId) as any[];

    return rows.map((row) => EditorTabSqliteMapper.toDomain(row));
  }

  async findRecentlyAccessed(groupId: string, limit: number): Promise<EditorTab[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM editor_tabs WHERE group_id = ? ORDER BY updated_at DESC LIMIT ?`,
    );
    const rows = stmt.all(groupId, limit) as any[];

    return rows.map((row) => EditorTabSqliteMapper.toDomain(row));
  }

  async save(tab: EditorTab): Promise<void> {
    const dto = tab.toServerDTO();

    const stmt = this.db.prepare(`
      INSERT INTO editor_tabs (
        id, group_id, document_id, tab_index, is_pinned, is_dirty,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        tab_index = excluded.tab_index,
        is_pinned = excluded.is_pinned,
        is_dirty = excluded.is_dirty,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      dto.id,
      dto.groupId,
      dto.documentId,
      dto.tabIndex,
      dto.isPinned ? 1 : 0,
      dto.isDirty ? 1 : 0,
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
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        tab_index = excluded.tab_index,
        is_pinned = excluded.is_pinned,
        is_dirty = excluded.is_dirty,
        updated_at = excluded.updated_at
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
    const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM editor_tabs WHERE group_id = ?`);
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
}
