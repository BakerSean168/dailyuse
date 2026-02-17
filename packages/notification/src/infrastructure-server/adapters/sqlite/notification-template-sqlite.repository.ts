/**
 * NotificationTemplate SQLite Repository
 *
 * SQLite implementation of INotificationTemplateRepository.
 * Uses clean interface-aligned skeleton while persistence migration is ongoing.
 */

import type Database from 'better-sqlite3';
import type { INotificationTemplateRepository } from '../../../domain-server/repositories/INotificationTemplateRepository';
import type { NotificationTemplate } from '../../../domain-server/aggregates/notification-template';
import type { NotificationCategory, NotificationType } from '@dailyuse/contracts/notification';

export class SqliteNotificationTemplateRepository implements INotificationTemplateRepository {
  constructor(private readonly db: Database.Database) {}

  async save(template: NotificationTemplate): Promise<void> {
    throw new Error('Not implemented - refactor sqlite persistence to new notification-template model');
  }

  async findById(id: string): Promise<NotificationTemplate | null> {
    throw new Error('Not implemented - refactor sqlite persistence to new notification-template model');
  }

  async findAll(options?: { includeInactive?: boolean }): Promise<NotificationTemplate[]> {
    throw new Error('Not implemented - refactor sqlite persistence to new notification-template model');
  }

  async findByName(name: string): Promise<NotificationTemplate | null> {
    throw new Error('Not implemented - refactor sqlite persistence to new notification-template model');
  }

  async findByCategory(
    category: NotificationCategory,
    options?: { activeOnly?: boolean },
  ): Promise<NotificationTemplate[]> {
    throw new Error('Not implemented - refactor sqlite persistence to new notification-template model');
  }

  async findByType(type: NotificationType, options?: { activeOnly?: boolean }): Promise<NotificationTemplate[]> {
    throw new Error('Not implemented - refactor sqlite persistence to new notification-template model');
  }

  async findSystemTemplates(): Promise<NotificationTemplate[]> {
    throw new Error('Not implemented - refactor sqlite persistence to new notification-template model');
  }

  async delete(id: string): Promise<void> {
    throw new Error('Not implemented - refactor sqlite persistence to new notification-template model');
  }

  async exists(id: string): Promise<boolean> {
    throw new Error('Not implemented - refactor sqlite persistence to new notification-template model');
  }

  async isNameUsed(name: string, excludeId?: string): Promise<boolean> {
    throw new Error('Not implemented - refactor sqlite persistence to new notification-template model');
  }

  async count(options?: { activeOnly?: boolean }): Promise<number> {
    throw new Error('Not implemented - refactor sqlite persistence to new notification-template model');
  }
}

