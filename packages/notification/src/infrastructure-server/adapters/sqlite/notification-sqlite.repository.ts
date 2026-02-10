/**
 * SQLite Notification Repository Implementation
 * 閫氱煡鐨?SQLite Repository瀹炵幇
 */

import type Database from 'better-sqlite3';
import { Notification } from '@/domain-server';
import type { INotificationRepository } from '@/domain-server';

export class SqliteNotificationRepository implements INotificationRepository {
  constructor(private db: Database.Database) {}

  async save(notification: Notification): Promise<void> {
    const dto = notification.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO notifications (
        uuid, accountUuid, title, content, category, status,
        read_at, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        title = excluded.title,
        content = excluded.content,
        status = excluded.status,
        read_at = excluded.read_at,
        updatedAt = excluded.updatedAt
    `);

    stmt.run(
      dto.uuid,
      dto.accountUuid,
      dto.title,
      dto.content,
      dto.category,
      dto.status,
      dto.read_at || null,
      dto.createdAt,
      dto.updatedAt,
    );
  }

  async saveMany(notifications: Notification[]): Promise<void> {
    const insertStmt = this.db.prepare(`
      INSERT INTO notifications (
        uuid, accountUuid, title, content, category, status,
        read_at, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        title = excluded.title,
        content = excluded.content,
        status = excluded.status,
        read_at = excluded.read_at,
        updatedAt = excluded.updatedAt
    `);

    const transaction = this.db.transaction((items: Notification[]) => {
      for (const notif of items) {
        const dto = notif.toPersistenceDTO();
        insertStmt.run(
          dto.uuid,
          dto.accountUuid,
          dto.title,
          dto.content,
          dto.category,
          dto.status,
          dto.read_at || null,
          dto.createdAt,
          dto.updatedAt,
        );
      }
    });

    transaction(notifications);
  }

  async findById(uuid: string, options?: { includeChildren?: boolean }): Promise<Notification | null> {
    const stmt = this.db.prepare(`SELECT * FROM notifications WHERE uuid = ? LIMIT 1`);
    const row = stmt.get(uuid) as any;

    if (!row) return null;

    return Notification.fromPersistenceDTO({
      uuid: row.uuid,
      account_uuid: row.accountUuid,
      title: row.title,
      content: row.content,
      category: row.category,
      status: row.status,
      read_at: row.read_at ? new Date(row.read_at) : null,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }

  async findByAccountUuid(accountUuid: string): Promise<Notification[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM notifications WHERE accountUuid = ? ORDER BY createdAt DESC`
    );
    const rows = stmt.all(accountUuid) as any[];

    return rows.map((row) =>
      Notification.fromPersistenceDTO({
        uuid: row.uuid,
        account_uuid: row.accountUuid,
        title: row.title,
        content: row.content,
        category: row.category,
        status: row.status,
        read_at: row.read_at ? new Date(row.read_at) : null,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })
    );
  }

  async delete(uuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM notifications WHERE uuid = ?`);
    stmt.run(uuid);
  }

  async exists(uuid: string): Promise<boolean> {
    const stmt = this.db.prepare(`SELECT 1 FROM notifications WHERE uuid = ? LIMIT 1`);
    return stmt.get(uuid) !== undefined;
  }
}

