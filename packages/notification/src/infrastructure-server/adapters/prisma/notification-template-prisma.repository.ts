/**
 * NotificationTemplate Prisma Repository
 *
 * Prisma implementation of INotificationTemplateRepository.
 * Supports both PostgreSQL (API) and SQLite (Desktop).
 */

import type { INotificationTemplateRepository } from '../../ports/notification-template-repository.port';
import type { NotificationTemplate } from '../../../domain-server/aggregates/notification-template';
import type { NotificationCategory, NotificationType } from '@dailyuse/contracts/notification';

/**
 * NotificationTemplate Prisma Repository
 *
 * Skeleton implementation - to be completed when extracting from apps/api.
 */
export class NotificationTemplatePrismaRepository implements INotificationTemplateRepository {
  constructor(private readonly prisma: any) {}

  async save(template: NotificationTemplate): Promise<void> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findById(uuid: string): Promise<NotificationTemplate | null> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findAll(options?: { includeInactive?: boolean }): Promise<NotificationTemplate[]> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findByName(name: string): Promise<NotificationTemplate | null> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findByCategory(
    category: NotificationCategory,
    options?: { activeOnly?: boolean },
  ): Promise<NotificationTemplate[]> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findByType(type: NotificationType, options?: { activeOnly?: boolean }): Promise<NotificationTemplate[]> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findSystemTemplates(): Promise<NotificationTemplate[]> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async delete(uuid: string): Promise<void> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async exists(uuid: string): Promise<boolean> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async isNameUsed(name: string, excludeUuid?: string): Promise<boolean> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async count(options?: { activeOnly?: boolean }): Promise<number> {
    throw new Error('Not implemented - extract from apps/api');
  }
}
