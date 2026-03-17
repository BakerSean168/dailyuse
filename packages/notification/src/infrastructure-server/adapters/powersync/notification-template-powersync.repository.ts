import { generateUUID } from '@dailyuse/utils';
import type { IElectronDatabase } from '@dailyuse/contracts/electron';
import type { INotificationTemplateRepository } from '../../../domain-server/repositories/INotificationTemplateRepository';
import { NotificationTemplate } from '../../../domain-server/aggregates/notification-template';
import { NotificationTemplateConfig } from '../../../domain-server/value-objects/NotificationTemplateConfig';
import type { NotificationCategory, NotificationType } from '@dailyuse/contracts/notification';

interface NotificationTemplateRow {
  id: string;
  name: string;
  display_name: string | null;
  description: string | null;
  type: NotificationType;
  category: NotificationCategory;
  title_template: string | null;
  content_template: string | null;
  variables: string | null;
  default_actions: string | null;
  is_system: number | null;
  is_active: number | null;
  created_at: string;
  updated_at: string;
}

function hydrateTemplate(row: NotificationTemplateRow): NotificationTemplate {
  return NotificationTemplate.load({
    id: row.id as never,
    name: row.name,
    description: row.description,
    type: row.type,
    category: row.category,
    template: NotificationTemplateConfig.fromContract({
      template: {
        title: row.title_template ?? '',
        content: row.content_template ?? '',
        variables: row.variables ? (JSON.parse(row.variables) as string[]) : [],
      },
      channels: {
        inApp: true,
        email: false,
        push: false,
        sms: false,
      },
      emailTemplate: null,
      pushTemplate: null,
    }),
    isActive: row.is_active !== 0,
    isSystemTemplate: row.is_system === 1,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  });
}

export class PowerSyncNotificationTemplateRepository implements INotificationTemplateRepository {
  constructor(private readonly db: IElectronDatabase) {}

  async save(template: NotificationTemplate): Promise<void> {
    const dto = template.toServerDTO();
    await this.db.execute(
      `INSERT OR REPLACE INTO notification_templates (
         id, name, display_name, description, type, category, title_template, content_template,
         variables, default_actions, is_system, is_active, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        dto.id,
        dto.name,
        dto.name,
        dto.description,
        dto.type,
        dto.category,
        dto.template.template.title,
        dto.template.template.content,
        JSON.stringify(dto.template.template.variables ?? []),
        JSON.stringify([]),
        dto.isSystemTemplate ? 1 : 0,
        dto.isActive ? 1 : 0,
        new Date(dto.createdAt).toISOString(),
        new Date(dto.updatedAt).toISOString(),
      ],
    );
  }

  async findById(id: string): Promise<NotificationTemplate | null> {
    const row = await this.db.getOptional<NotificationTemplateRow>(
      `SELECT * FROM notification_templates WHERE id = ? LIMIT 1`,
      [id],
    );
    return row ? hydrateTemplate(row) : null;
  }

  async findAll(options?: { includeInactive?: boolean }): Promise<NotificationTemplate[]> {
    const rows = await this.db.getAll<NotificationTemplateRow>(
      `SELECT * FROM notification_templates ${options?.includeInactive ? '' : 'WHERE is_active = 1'} ORDER BY created_at DESC`,
    );
    return rows.map(hydrateTemplate);
  }

  async findByName(name: string): Promise<NotificationTemplate | null> {
    const row = await this.db.getOptional<NotificationTemplateRow>(
      `SELECT * FROM notification_templates WHERE name = ? LIMIT 1`,
      [name],
    );
    return row ? hydrateTemplate(row) : null;
  }

  async findByCategory(
    category: NotificationCategory,
    options?: { activeOnly?: boolean },
  ): Promise<NotificationTemplate[]> {
    const rows = await this.db.getAll<NotificationTemplateRow>(
      `SELECT * FROM notification_templates WHERE category = ? ${options?.activeOnly === false ? '' : 'AND is_active = 1'} ORDER BY created_at DESC`,
      [category],
    );
    return rows.map(hydrateTemplate);
  }

  async findByType(
    type: NotificationType,
    options?: { activeOnly?: boolean },
  ): Promise<NotificationTemplate[]> {
    const rows = await this.db.getAll<NotificationTemplateRow>(
      `SELECT * FROM notification_templates WHERE type = ? ${options?.activeOnly === false ? '' : 'AND is_active = 1'} ORDER BY created_at DESC`,
      [type],
    );
    return rows.map(hydrateTemplate);
  }

  async findSystemTemplates(): Promise<NotificationTemplate[]> {
    const rows = await this.db.getAll<NotificationTemplateRow>(
      `SELECT * FROM notification_templates WHERE is_system = 1 ORDER BY created_at DESC`,
    );
    return rows.map(hydrateTemplate);
  }

  async delete(id: string): Promise<void> {
    await this.db.execute(`DELETE FROM notification_templates WHERE id = ?`, [id]);
  }

  async exists(id: string): Promise<boolean> {
    return (await this.findById(id)) !== null;
  }

  async isNameUsed(name: string, excludeId?: string): Promise<boolean> {
    const row = await this.db.getOptional<{ count: number }>(
      `SELECT COUNT(*) as count FROM notification_templates WHERE name = ? ${excludeId ? 'AND id != ?' : ''}`,
      excludeId ? [name, excludeId] : [name],
    );
    return Number(row?.count ?? 0) > 0;
  }

  async count(options?: { activeOnly?: boolean }): Promise<number> {
    const row = await this.db.getOptional<{ count: number }>(
      `SELECT COUNT(*) as count FROM notification_templates ${options?.activeOnly === false ? '' : 'WHERE is_active = 1'}`,
    );
    return Number(row?.count ?? 0);
  }
}
