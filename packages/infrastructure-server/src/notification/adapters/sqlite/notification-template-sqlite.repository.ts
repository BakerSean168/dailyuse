/**
 * SQLite NotificationTemplate Repository Implementation
 * 閫氱煡妯℃澘鐨?SQLite Repository瀹炵幇
 */

import type Database from 'better-sqlite3';
import { NotificationTemplate } from '@dailyuse/domain-server/notification';
import type { INotificationTemplateRepository } from '@dailyuse/domain-server/notification';

export class SqliteNotificationTemplateRepository implements INotificationTemplateRepository {
  constructor(private db: Database.Database) {}

  async save(template: NotificationTemplate): Promise<void> {
    const dto = template.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO notification_templates (
        uuid, name, category, type, content, is_active, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        name = excluded.name,
        content = excluded.content,
        is_active = excluded.is_active,
        updatedAt = excluded.updatedAt
    `);

    stmt.run(
      dto.uuid,
      dto.name,
      dto.category,
      dto.type,
      dto.content,
      dto.is_active ? 1 : 0,
      dto.createdAt,
      dto.updatedAt,
    );
  }

  async findById(uuid: string): Promise<NotificationTemplate | null> {
    const stmt = this.db.prepare(`SELECT * FROM notification_templates WHERE uuid = ? LIMIT 1`);
    const row = stmt.get(uuid) as any;

    if (!row) return null;

    return NotificationTemplate.fromPersistenceDTO({
      uuid: row.uuid,
      name: row.name,
      category: row.category,
      type: row.type,
      content: row.content,
      is_active: row.is_active === 1,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }

  async findAll(options?: { includeInactive?: boolean }): Promise<NotificationTemplate[]> {
    let query = `SELECT * FROM notification_templates`;
    const params: any[] = [];

    if (!options?.includeInactive) {
      query += ` WHERE is_active = 1`;
    }

    query += ` ORDER BY createdAt DESC`;

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as any[];

    return rows.map((row) =>
      NotificationTemplate.fromPersistenceDTO({
        uuid: row.uuid,
        name: row.name,
        category: row.category,
        type: row.type,
        content: row.content,
        is_active: row.is_active === 1,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })
    );
  }

  async findByName(name: string): Promise<NotificationTemplate | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM notification_templates WHERE name = ? LIMIT 1`
    );
    const row = stmt.get(name) as any;

    if (!row) return null;

    return NotificationTemplate.fromPersistenceDTO({
      uuid: row.uuid,
      name: row.name,
      category: row.category,
      type: row.type,
      content: row.content,
      is_active: row.is_active === 1,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }

  async findByCategory(
    category: string,
    options?: { activeOnly?: boolean },
  ): Promise<NotificationTemplate[]> {
    let query = `SELECT * FROM notification_templates WHERE category = ?`;
    const params: any[] = [category];

    if (options?.activeOnly !== false) {
      query += ` AND is_active = 1`;
    }

    query += ` ORDER BY createdAt DESC`;

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as any[];

    return rows.map((row) =>
      NotificationTemplate.fromPersistenceDTO({
        uuid: row.uuid,
        name: row.name,
        category: row.category,
        type: row.type,
        content: row.content,
        is_active: row.is_active === 1,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })
    );
  }

  async delete(uuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM notification_templates WHERE uuid = ?`);
    stmt.run(uuid);
  }
}

