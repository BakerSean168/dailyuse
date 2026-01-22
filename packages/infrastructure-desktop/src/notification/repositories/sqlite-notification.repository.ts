/**
 * SQLite Notification Repository Implementation
 * 通知的 SQLite 仓储实现
 */

import type Database from 'better-sqlite3';
import { Notification } from '@dailyuse/domain-server/notification';
import type { INotificationRepository } from '@dailyuse/domain-server/notification';

export class SqliteNotificationRepository implements INotificationRepository {
  constructor(private db: Database.Database) {}

  async save(notification: Notification): Promise<void> {
    const dto = notification.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO notifications (
        uuid, account_uuid, title, content, category, status,
        read_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        title = excluded.title,
        content = excluded.content,
        status = excluded.status,
        read_at = excluded.read_at,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      dto.uuid,
      dto.account_uuid,
      dto.title,
      dto.content,
      dto.category,
      dto.status,
      dto.read_at || null,
      dto.created_at,
      dto.updated_at,
    );
  }

  async saveMany(notifications: Notification[]): Promise<void> {
    const insertStmt = this.db.prepare(`
      INSERT INTO notifications (
        uuid, account_uuid, title, content, category, status,
        read_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        title = excluded.title,
        content = excluded.content,
        status = excluded.status,
        read_at = excluded.read_at,
        updated_at = excluded.updated_at
    `);

    const transaction = this.db.transaction((items: Notification[]) => {
      for (const notif of items) {
        const dto = notif.toPersistenceDTO();
        insertStmt.run(
          dto.uuid,
          dto.account_uuid,
          dto.title,
          dto.content,
          dto.category,
          dto.status,
          dto.read_at || null,
          dto.created_at,
          dto.updated_at,
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
      account_uuid: row.account_uuid,
      title: row.title,
      content: row.content,
      category: row.category,
      status: row.status,
      read_at: row.read_at ? new Date(row.read_at) : null,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    });
  }

  async findByAccountUuid(accountUuid: string): Promise<Notification[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM notifications WHERE account_uuid = ? ORDER BY created_at DESC`
    );
    const rows = stmt.all(accountUuid) as any[];

    return rows.map((row) =>
      Notification.fromPersistenceDTO({
        uuid: row.uuid,
        account_uuid: row.account_uuid,
        title: row.title,
        content: row.content,
        category: row.category,
        status: row.status,
        read_at: row.read_at ? new Date(row.read_at) : null,
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at),
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
