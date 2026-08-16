// Residual 1025: sole parseJsonSafe (local dual retired).
import { parseJsonSafe } from '@memoflow/utils/shared';
/**
 * NotificationTemplate Prisma Repository
 *
 * Prisma implementation of INotificationTemplateRepository.
 * Supports both PostgreSQL (API) and SQLite (Desktop).
 *
 * Mapping notes:
 * - Domain NotificationTemplate.template (NotificationTemplateConfig VO) is decomposed to:
 *   → Prisma titleTemplate, contentTemplate, variables, defaultActions
 * - Domain isSystemTemplate → Prisma isSystem
 * - Prisma displayName maps to the template name
 */

import type { PrismaClient, Prisma } from '@memoflow/database';
import type { INotificationTemplateRepository } from '../../../domain';
import { NotificationTemplate } from '../../../domain/aggregates/notification-template';
import { NotificationTemplateConfig } from '../../../domain/value-objects/notification-template-config';
import type { NotificationCategory, NotificationType } from '@memoflow/contracts/notification';
import { AggregateRepositoryBase, createEventBusAdapter } from '@memoflow/patterns';
import { eventBus } from '@memoflow/utils/domain';

const eventBusAdapter = createEventBusAdapter(eventBus);

// ============================================================
// Type definitions for Prisma query results
// ============================================================

type PrismaNotificationTemplate = {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  type: string;
  category: string;
  titleTemplate: string;
  contentTemplate: string;
  variables: string | null;
  defaultActions: string | null;
  isSystem: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

// ============================================================
// Mappers: Prisma → Domain
// ============================================================

/**
 * Structural row input for the template mapper. The generated Prisma row is a
 * structural superset (extra timestamp/relation columns), so this widens the
 * accepted input to any object carrying the mapped fields — removing the
 * the raw cast boundary casts at every repository call site.
 * 模板 mapper 的结构化行输入。生成的 Prisma row 是结构超集（额外的时间戳/关系
 * 列），因此放宽接受的输入为任何携带被映射字段的对象——消除每个 repository
 * 调用点的 the raw cast 边界强转。
 */
type NotificationTemplateRowLike = Pick<
  PrismaNotificationTemplate,
  | 'id'
  | 'name'
  | 'displayName'
  | 'description'
  | 'type'
  | 'category'
  | 'titleTemplate'
  | 'contentTemplate'
  | 'variables'
  | 'defaultActions'
  | 'isSystem'
  | 'isActive'
  | 'createdAt'
  | 'updatedAt'
>;

function mapPrismaTemplateToDomain(row: NotificationTemplateRowLike): NotificationTemplate {
  return NotificationTemplate.load({
    id: row.id as never,
    name: row.name,
    description: row.description,
    type: row.type as NotificationType,
    category: row.category as NotificationCategory,
    template: NotificationTemplateConfig.fromContract({
      template: {
        title: row.titleTemplate,
        content: row.contentTemplate,
        variables: parseJsonSafe<string[]>(row.variables) ?? [],
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
    isActive: row.isActive,
    isSystemTemplate: row.isSystem,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

/**
 * NotificationTemplate Prisma Repository
 */
export class NotificationTemplatePrismaRepository
  extends AggregateRepositoryBase<NotificationTemplate>
  implements INotificationTemplateRepository
{
  constructor(private readonly prisma: PrismaClient) {
    super(eventBusAdapter);
  }

  protected async persist(template: NotificationTemplate): Promise<void> {
    const dto = template.toServerDTO();
    const templateConfig = dto.template;

    await this.prisma.notificationTemplate.upsert({
      where: { id: String(dto.id) },
      create: {
        id: String(dto.id),
        name: dto.name,
        displayName: dto.name,
        description: dto.description,
        type: dto.type,
        category: dto.category,
        titleTemplate: templateConfig.template.title,
        contentTemplate: templateConfig.template.content,
        variables: JSON.stringify(templateConfig.template.variables ?? []),
        defaultActions: JSON.stringify([]),
        isSystem: dto.isSystemTemplate,
        isActive: dto.isActive,
      },
      update: {
        name: dto.name,
        displayName: dto.name,
        description: dto.description,
        type: dto.type,
        category: dto.category,
        titleTemplate: templateConfig.template.title,
        contentTemplate: templateConfig.template.content,
        variables: JSON.stringify(templateConfig.template.variables ?? []),
        isSystem: dto.isSystemTemplate,
        isActive: dto.isActive,
        updatedAt: new Date(),
      },
    });
  }

  async findById(id: string): Promise<NotificationTemplate | null> {
    const row = await this.prisma.notificationTemplate.findUnique({
      where: { id },
    });
    if (!row) return null;
    return mapPrismaTemplateToDomain(row);
  }

  async findAll(options?: { includeInactive?: boolean }): Promise<NotificationTemplate[]> {
    const where: Prisma.NotificationTemplateWhereInput = {};

    if (!options?.includeInactive) {
      where.isActive = true;
    }

    const rows = await this.prisma.notificationTemplate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) => mapPrismaTemplateToDomain(row));
  }

  async findByName(name: string): Promise<NotificationTemplate | null> {
    const row = await this.prisma.notificationTemplate.findUnique({
      where: { name },
    });
    if (!row) return null;
    return mapPrismaTemplateToDomain(row);
  }

  async findByCategory(
    category: NotificationCategory,
    options?: { activeOnly?: boolean },
  ): Promise<NotificationTemplate[]> {
    const where: Prisma.NotificationTemplateWhereInput = { category };

    if (options?.activeOnly !== false) {
      where.isActive = true;
    }

    const rows = await this.prisma.notificationTemplate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) => mapPrismaTemplateToDomain(row));
  }

  async findByType(
    type: NotificationType,
    options?: { activeOnly?: boolean },
  ): Promise<NotificationTemplate[]> {
    const where: Prisma.NotificationTemplateWhereInput = { type };

    if (options?.activeOnly !== false) {
      where.isActive = true;
    }

    const rows = await this.prisma.notificationTemplate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) => mapPrismaTemplateToDomain(row));
  }

  async findSystemTemplates(): Promise<NotificationTemplate[]> {
    const rows = await this.prisma.notificationTemplate.findMany({
      where: { isSystem: true },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) => mapPrismaTemplateToDomain(row));
  }

  async delete(id: string): Promise<void> {
    await this.prisma.notificationTemplate.delete({ where: { id } });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.notificationTemplate.count({ where: { id } });
    return count > 0;
  }

  async isNameUsed(name: string, excludeId?: string): Promise<boolean> {
    const where: Prisma.NotificationTemplateWhereInput = { name };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    const count = await this.prisma.notificationTemplate.count({ where });
    return count > 0;
  }

  async count(options?: { activeOnly?: boolean }): Promise<number> {
    const where: Prisma.NotificationTemplateWhereInput = {};

    if (options?.activeOnly !== false) {
      where.isActive = true;
    }

    return this.prisma.notificationTemplate.count({ where });
  }
}
