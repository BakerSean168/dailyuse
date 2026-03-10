import type { IElectronDatabase } from '@dailyuse/contracts/electron';
import type { INotificationTemplateRepository } from '../../../domain-server/repositories/INotificationTemplateRepository';
import type { NotificationTemplate } from '../../../domain-server/aggregates/notification-template';
import type { NotificationCategory, NotificationType } from '@dailyuse/contracts/notification';

export class PowerSyncNotificationTemplateRepository implements INotificationTemplateRepository {
  constructor(private readonly db: IElectronDatabase) {}

  async save(_template: NotificationTemplate): Promise<void> {
    throw new Error('Not implemented - extract from apps/desktop');
  }

  async findById(_id: string): Promise<NotificationTemplate | null> {
    throw new Error('Not implemented - extract from apps/desktop');
  }

  async findAll(_options?: { includeInactive?: boolean }): Promise<NotificationTemplate[]> {
    throw new Error('Not implemented - extract from apps/desktop');
  }

  async findByName(_name: string): Promise<NotificationTemplate | null> {
    throw new Error('Not implemented - extract from apps/desktop');
  }

  async findByCategory(
    _category: NotificationCategory,
    _options?: { activeOnly?: boolean },
  ): Promise<NotificationTemplate[]> {
    throw new Error('Not implemented - extract from apps/desktop');
  }

  async findByType(
    _type: NotificationType,
    _options?: { activeOnly?: boolean },
  ): Promise<NotificationTemplate[]> {
    throw new Error('Not implemented - extract from apps/desktop');
  }

  async findSystemTemplates(): Promise<NotificationTemplate[]> {
    throw new Error('Not implemented - extract from apps/desktop');
  }

  async delete(_id: string): Promise<void> {
    throw new Error('Not implemented - extract from apps/desktop');
  }

  async exists(_id: string): Promise<boolean> {
    throw new Error('Not implemented - extract from apps/desktop');
  }

  async isNameUsed(_name: string, _excludeId?: string): Promise<boolean> {
    throw new Error('Not implemented - extract from apps/desktop');
  }

  async count(_options?: { activeOnly?: boolean }): Promise<number> {
    throw new Error('Not implemented - extract from apps/desktop');
  }
}
