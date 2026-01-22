/**
 * SQLite NotificationTemplate Repository Implementation
 * 通知模板的 SQLite 仓储实现
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
        uuid, name, category, type, content, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        name = excluded.name,
        content = excluded.content,
        is_active = excluded.is_active,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      dto.uuid,
      dto.name,
      dto.category,
      dto.type,
      dto.content,
      dto.is_active ? 1 : 0,
      dto.created_at,
      dto.updated_at,
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
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    });
  }

  async findAll(options?: { includeInactive?: boolean }): Promise<NotificationTemplate[]> {
    let query = `SELECT * FROM notification_templates`;
    const params: any[] = [];

    if (!options?.includeInactive) {
      query += ` WHERE is_active = 1`;
    }

    query += ` ORDER BY created_at DESC`;

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
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at),
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
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
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

    query += ` ORDER BY created_at DESC`;

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
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at),
      })
    );
  }

  async delete(uuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM notification_templates WHERE uuid = ?`);
    stmt.run(uuid);
  }
}
