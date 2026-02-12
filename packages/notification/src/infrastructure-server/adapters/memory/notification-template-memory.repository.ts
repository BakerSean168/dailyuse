/**
 * NotificationTemplate Memory Repository
 *
 * In-memory implementation of INotificationTemplateRepository for testing.
 */

import type { INotificationTemplateRepository } from '../../ports/notification-template-repository.port';
import type { NotificationTemplate } from '../../../domain-server/aggregates/notification-template';
import type { NotificationCategory, NotificationType } from '@dailyuse/contracts/notification';

/**
 * NotificationTemplate Memory Repository
 *
 * In-memory implementation for testing purposes.
 */
export class NotificationTemplateMemoryRepository implements INotificationTemplateRepository {
  private templates = new Map<string, NotificationTemplate>();

  async save(template: NotificationTemplate): Promise<void> {
    this.templates.set((template as any).uuid, template);
  }

  async findById(uuid: string): Promise<NotificationTemplate | null> {
    return this.templates.get(uuid) ?? null;
  }

  async findAll(options?: { includeInactive?: boolean }): Promise<NotificationTemplate[]> {
    const all = Array.from(this.templates.values());
    if (options?.includeInactive) return all;
    return all.filter((t: any) => t.isActive !== false);
  }

  async findByName(name: string): Promise<NotificationTemplate | null> {
    return Array.from(this.templates.values()).find((t: any) => t.name === name) ?? null;
  }

  async findByCategory(
    category: NotificationCategory,
    options?: { activeOnly?: boolean },
  ): Promise<NotificationTemplate[]> {
    let result = Array.from(this.templates.values()).filter((t: any) => t.category === category);
    if (options?.activeOnly !== false) {
      result = result.filter((t: any) => t.isActive !== false);
    }
    return result;
  }

  async findByType(type: NotificationType, options?: { activeOnly?: boolean }): Promise<NotificationTemplate[]> {
    let result = Array.from(this.templates.values()).filter((t: any) => t.type === type);
    if (options?.activeOnly !== false) {
      result = result.filter((t: any) => t.isActive !== false);
    }
    return result;
  }

  async findSystemTemplates(): Promise<NotificationTemplate[]> {
    return Array.from(this.templates.values()).filter((t: any) => t.isSystem === true);
  }

  async delete(uuid: string): Promise<void> {
    this.templates.delete(uuid);
  }

  async exists(uuid: string): Promise<boolean> {
    return this.templates.has(uuid);
  }

  async isNameUsed(name: string, excludeUuid?: string): Promise<boolean> {
    return Array.from(this.templates.values()).some(
      (t: any) => t.name === name && t.uuid !== excludeUuid,
    );
  }

  async count(options?: { activeOnly?: boolean }): Promise<number> {
    if (options?.activeOnly) {
      return Array.from(this.templates.values()).filter((t: any) => t.isActive !== false).length;
    }
    return this.templates.size;
  }

  // Test helpers
  clear(): void {
    this.templates.clear();
  }

  seed(templates: NotificationTemplate[]): void {
    templates.forEach((t: any) => this.templates.set(t.uuid, t));
  }
}
