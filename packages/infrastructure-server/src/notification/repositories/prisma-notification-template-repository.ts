// @ts-nocheck
import { PrismaClient } from '@prisma/client';
import type { NotificationRepository as INotificationTemplateRepository } from '@dailyuse/domain-server/notification';
import { NotificationTemplate } from '@dailyuse/domain-server/notification';
import type { NotificationServerDTO, NotificationPreferenceServerDTO } from '@dailyuse/contracts/notification';


/**
 * NotificationTemplate Prisma 仓储实现
 * 简单聚合根，无子实体
 * JSON 字段：variables, default_actions
 */
export class PrismaNotificationTemplateRepository implements INotificationTemplateRepository {
  constructor(private prisma: PrismaClient) {}

  private mapToEntity(data: any): NotificationTemplate | null {
    if (!data) return null;

    // The 'data' object is from Prisma, map it to the Persistence DTO
    const dto: NotificationTemplateAggregatePersistenceDTO = {
      uuid: data.uuid,
      name: data.name,
      description: data.description,
      type: data.type,
      category: data.category,
      isActive: data.isActive,
      isSystemTemplate: data.isSystem,
      createdAt: data.createdAt.getTime(),
      updatedAt: data.updatedAt.getTime(),

      // Core template fields
      templateTitle: data.titleTemplate,
      templateContent: data.contentTemplate,
      templateVariables: data.variables,

      // These fields do not exist on the base Prisma model, so they are undefined.
      // The domain entity's fromPersistenceDTO should handle this.
      templateLayout: undefined,
      templateStyle: undefined,
      templateEmailSubject: undefined,
      templateEmailHtmlBody: undefined,
      templateEmailTextBody: undefined,
      templatePushTitle: undefined,
      templatePushBody: undefined,
      templatePushIcon: undefined,
      templatePushSound: undefined,
    };

    return NotificationTemplate.fromPersistenceDTO(dto);
  }

  private toDate(timestamp: number | null | undefined): Date | null | undefined {
    if (timestamp == null) return timestamp as null | undefined;
    return new Date(timestamp);
  }

  async save(template: NotificationTemplate): Promise<void> {
    const persistence = template.toPersistenceDTO();
    // Only map fields that exist in the Prisma model
    await this.prisma.notificationTemplate.upsert({
      where: { uuid: persistence.uuid },
      create: {
        uuid: persistence.uuid,
        name: persistence.name,
        displayName: persistence.name, // Assuming name is used for displayName
        description: persistence.description,
        type: persistence.type,
        category: persistence.category,
        isActive: persistence.isActive,
        isSystem: persistence.isSystemTemplate,
        titleTemplate: persistence.templateTitle,
        contentTemplate: persistence.templateContent,
        variables: persistence.templateVariables,
        defaultActions: persistence.templatePushBody, // Example mapping, adjust as needed
      },
      update: {
        name: persistence.name,
        displayName: persistence.name,
        description: persistence.description,
        type: persistence.type,
        category: persistence.category,
        isActive: persistence.isActive,
        isSystem: persistence.isSystemTemplate,
        titleTemplate: persistence.templateTitle,
        contentTemplate: persistence.templateContent,
        variables: persistence.templateVariables,
        defaultActions: persistence.templatePushBody, // Example mapping, adjust as needed
      },
    });
  }

  async findById(uuid: string): Promise<NotificationTemplate | null> {
    const data = await this.prisma.notificationTemplate.findUnique({ where: { uuid } });
    return data ? this.mapToEntity(data) : null;
  }

  async findAll(): Promise<NotificationTemplate[]> {
    const templates = await this.prisma.notificationTemplate.findMany();
    return templates
      .map((t) => this.mapToEntity(t))
      .filter((t): t is NotificationTemplate => t !== null);
  }

  async findActives(): Promise<NotificationTemplate[]> {
    const templates = await this.prisma.notificationTemplate.findMany({
      where: { isActive: true },
    });
    return templates
      .map((t) => this.mapToEntity(t))
      .filter((t): t is NotificationTemplate => t !== null);
  }

  async findByType(type: NotificationType): Promise<NotificationTemplate[]> {
    const templates = await this.prisma.notificationTemplate.findMany({
      where: { type },
    });
    return templates
      .map((t) => this.mapToEntity(t))
      .filter((t): t is NotificationTemplate => t !== null);
  }

  async findByCategory(category: NotificationCategory): Promise<NotificationTemplate[]> {
    const templates = await this.prisma.notificationTemplate.findMany({
      where: { category },
    });
    return templates
      .map((t) => this.mapToEntity(t))
      .filter((t): t is NotificationTemplate => t !== null);
  }

  async findByName(name: string): Promise<NotificationTemplate | null> {
    const template = await this.prisma.notificationTemplate.findUnique({
      where: { name },
    });
    return this.mapToEntity(template);
  }

  async findSystemTemplates(): Promise<NotificationTemplate[]> {
    const templates = await this.prisma.notificationTemplate.findMany({
      where: { isSystem: true },
    });
    return templates
      .map((t) => this.mapToEntity(t))
      .filter((t): t is NotificationTemplate => t !== null);
  }

  async delete(uuid: string): Promise<void> {
    await this.prisma.notificationTemplate.delete({ where: { uuid } });
  }

  async exists(uuid: string): Promise<boolean> {
    const count = await this.prisma.notificationTemplate.count({ where: { uuid } });
    return count > 0;
  }

  async isNameUsed(name: string, excludeUuid?: string): Promise<boolean> {
    const count = await this.prisma.notificationTemplate.count({
      where: {
        name,
        ...(excludeUuid ? { uuid: { not: excludeUuid } } : {}),
      },
    });
    return count > 0;
  }

  async count(options?: { activeOnly?: boolean }): Promise<number> {
    const where = options?.activeOnly ? { isActive: true } : {};
    return await this.prisma.notificationTemplate.count({ where });
  }
}

