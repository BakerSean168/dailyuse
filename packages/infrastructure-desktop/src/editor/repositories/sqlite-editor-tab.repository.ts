/**
 * SQLite EditorTab Repository Implementation
 * 编辑器标签的 SQLite 仓储实现
 */

import type Database from 'better-sqlite3';
import { EditorTab } from '@dailyuse/domain-server/editor';
import type { IEditorTabRepository } from '@dailyuse/domain-server/editor';

export class SqliteEditorTabRepository implements IEditorTabRepository {
  constructor(private db: Database.Database) {}

  async findByUuid(uuid: string): Promise<EditorTab | null> {
    const stmt = this.db.prepare(`SELECT * FROM editor_tabs WHERE uuid = ? LIMIT 1`);
    const row = stmt.get(uuid) as any;

    if (!row) return null;

    return EditorTab.fromPersistenceDTO({
      uuid: row.uuid,
      group_uuid: row.group_uuid,
      document_uuid: row.document_uuid,
      tab_index: row.tab_index,
      is_pinned: row.is_pinned === 1,
      is_dirty: row.is_dirty === 1,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    });
  }

  async findByGroupUuid(groupUuid: string): Promise<EditorTab[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM editor_tabs WHERE group_uuid = ? ORDER BY tab_index ASC`
    );
    const rows = stmt.all(groupUuid) as any[];

    return rows.map((row) =>
      EditorTab.fromPersistenceDTO({
        uuid: row.uuid,
        group_uuid: row.group_uuid,
        document_uuid: row.document_uuid,
        tab_index: row.tab_index,
        is_pinned: row.is_pinned === 1,
        is_dirty: row.is_dirty === 1,
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at),
      })
    );
  }

  async findByDocumentUuid(documentUuid: string): Promise<EditorTab[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM editor_tabs WHERE document_uuid = ? ORDER BY created_at DESC`
    );
    const rows = stmt.all(documentUuid) as any[];

    return rows.map((row) =>
      EditorTab.fromPersistenceDTO({
        uuid: row.uuid,
        group_uuid: row.group_uuid,
        document_uuid: row.document_uuid,
        tab_index: row.tab_index,
        is_pinned: row.is_pinned === 1,
        is_dirty: row.is_dirty === 1,
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at),
      })
    );
  }

  async findByGroupUuidAndTabIndex(groupUuid: string, tabIndex: number): Promise<EditorTab | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM editor_tabs WHERE group_uuid = ? AND tab_index = ? LIMIT 1`
    );
    const row = stmt.get(groupUuid, tabIndex) as any;

    if (!row) return null;

    return EditorTab.fromPersistenceDTO({
      uuid: row.uuid,
      group_uuid: row.group_uuid,
      document_uuid: row.document_uuid,
      tab_index: row.tab_index,
      is_pinned: row.is_pinned === 1,
      is_dirty: row.is_dirty === 1,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    });
  }

  async findPinnedByGroupUuid(groupUuid: string): Promise<EditorTab[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM editor_tabs WHERE group_uuid = ? AND is_pinned = 1 ORDER BY tab_index ASC`
    );
    const rows = stmt.all(groupUuid) as any[];

    return rows.map((row) => this.rowToTab(row));
  }

  async findDirtyByGroupUuid(groupUuid: string): Promise<EditorTab[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM editor_tabs WHERE group_uuid = ? AND is_dirty = 1 ORDER BY updated_at DESC`
    );
    const rows = stmt.all(groupUuid) as any[];

    return rows.map((row) => this.rowToTab(row));
  }

  async findRecentlyAccessed(groupUuid: string, limit: number): Promise<EditorTab[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM editor_tabs WHERE group_uuid = ? ORDER BY updated_at DESC LIMIT ?`
    );
    const rows = stmt.all(groupUuid, limit) as any[];

    return rows.map((row) => this.rowToTab(row));
  }

  async save(tab: EditorTab): Promise<void> {
    const dto = tab.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO editor_tabs (
        uuid, group_uuid, document_uuid, tab_index, is_pinned, is_dirty,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        tab_index = excluded.tab_index,
        is_pinned = excluded.is_pinned,
        is_dirty = excluded.is_dirty,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      dto.uuid,
      dto.group_uuid,
      dto.document_uuid,
      dto.tab_index,
      dto.is_pinned ? 1 : 0,
      dto.is_dirty ? 1 : 0,
      dto.created_at,
      dto.updated_at,
    );
  }

  async delete(uuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM editor_tabs WHERE uuid = ?`);
    stmt.run(uuid);
  }

  async saveBatch(tabs: EditorTab[]): Promise<void> {
    const insertStmt = this.db.prepare(`
      INSERT INTO editor_tabs (
        uuid, group_uuid, document_uuid, tab_index, is_pinned, is_dirty,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        tab_index = excluded.tab_index,
        is_pinned = excluded.is_pinned,
        is_dirty = excluded.is_dirty,
        updated_at = excluded.updated_at
    `);

    const transaction = this.db.transaction((items: EditorTab[]) => {
      for (const tab of items) {
        const dto = tab.toPersistenceDTO();
        insertStmt.run(
          dto.uuid,
          dto.group_uuid,
          dto.document_uuid,
          dto.tab_index,
          dto.is_pinned ? 1 : 0,
          dto.is_dirty ? 1 : 0,
          dto.created_at,
          dto.updated_at,
        );
      }
    });

    transaction(tabs);
  }

  async deleteByGroupUuid(groupUuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM editor_tabs WHERE group_uuid = ?`);
    stmt.run(groupUuid);
  }

  private rowToTab(row: any): EditorTab {
    return EditorTab.fromPersistenceDTO({
      uuid: row.uuid,
      group_uuid: row.group_uuid,
      document_uuid: row.document_uuid,
      tab_index: row.tab_index,
      is_pinned: row.is_pinned === 1,
      is_dirty: row.is_dirty === 1,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    });
  }
}
