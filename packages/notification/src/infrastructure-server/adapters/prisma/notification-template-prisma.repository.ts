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

import type { PrismaClient, Prisma } from '@dailyuse/database';
import type { INotificationTemplateRepository } from '../../../domain-server';
import { NotificationTemplate } from '../../../domain-server/aggregates/notification-template';
import { NotificationTemplateConfig } from '../../../domain-server/value-objects/notification-template-config';
import type { NotificationCategory, NotificationType } from '@dailyuse/contracts/notification';

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

function parseJsonSafe<T>(value: string | null | undefined): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function mapPrismaTemplateToDomain(row: PrismaNotificationTemplate): NotificationTemplate {
  return NotificationTemplate.load({
    id: row.id as any,
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
export class NotificationTemplatePrismaRepository implements INotificationTemplateRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(template: NotificationTemplate): Promise<void> {
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
    return mapPrismaTemplateToDomain(row as unknown as PrismaNotificationTemplate);
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

    return rows.map((row) =>
      mapPrismaTemplateToDomain(row as unknown as PrismaNotificationTemplate),
    );
  }

  async findByName(name: string): Promise<NotificationTemplate | null> {
    const row = await this.prisma.notificationTemplate.findUnique({
      where: { name },
    });
    if (!row) return null;
    return mapPrismaTemplateToDomain(row as unknown as PrismaNotificationTemplate);
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

    return rows.map((row) =>
      mapPrismaTemplateToDomain(row as unknown as PrismaNotificationTemplate),
    );
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

    return rows.map((row) =>
      mapPrismaTemplateToDomain(row as unknown as PrismaNotificationTemplate),
    );
  }

  async findSystemTemplates(): Promise<NotificationTemplate[]> {
    const rows = await this.prisma.notificationTemplate.findMany({
      where: { isSystem: true },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) =>
      mapPrismaTemplateToDomain(row as unknown as PrismaNotificationTemplate),
    );
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
