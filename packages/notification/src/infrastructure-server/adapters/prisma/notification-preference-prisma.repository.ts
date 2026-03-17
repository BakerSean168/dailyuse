/**
 * NotificationPreference Prisma Repository
 *
 * Prisma implementation of INotificationPreferenceRepository.
 * Supports both PostgreSQL (API) and SQLite (Desktop).
 *
 * Mapping notes:
 * - Domain NotificationPreference.settings (Map<string, NotificationChannelType[]>)
 *   → Prisma channels (JSON string of Record<string, boolean>)
 *   → Prisma categories (JSON string of Record<string, Record<string, boolean>>)
 * - The settings Map is decomposed into per-module channel booleans for Prisma storage
 */

import type { PrismaClient } from '@dailyuse/database';
import type { INotificationPreferenceRepository } from '../../../domain-server';
import { NotificationPreference } from '../../../domain-server/aggregates/notification-preference';
import { NotificationChannelType } from '@dailyuse/contracts/notification';
import { generateUUID } from '@dailyuse/utils';

// ============================================================
// Type definitions for Prisma query results
// ============================================================

type PrismaNotificationPreference = {
  id: string;
  identityId: string;
  enabled: boolean;
  channels: string;
  categories: string;
  doNotDisturb: string | null;
  rateLimit: string | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
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

function mapPrismaPreferenceToDomain(row: PrismaNotificationPreference): NotificationPreference {
  const channels = parseJsonSafe<Record<string, boolean>>(row.channels) ?? {};
  const categories =
    parseJsonSafe<Record<string, Record<string, boolean> | boolean>>(row.categories) ?? {};
  const enabled = row.enabled;

  const settings = new Map<
    string,
    (typeof NotificationChannelType)[keyof typeof NotificationChannelType][]
  >();

  const mapEnabledChannels = (value: Record<string, boolean> | boolean | undefined) => {
    if (!enabled || !value || typeof value === 'boolean') {
      return [];
    }

    const result: (typeof NotificationChannelType)[keyof typeof NotificationChannelType][] = [];
    if (value.inApp ?? channels.inApp) result.push(NotificationChannelType.InApp);
    if (value.email ?? channels.email) result.push(NotificationChannelType.Email);
    if (value.push ?? channels.push) result.push(NotificationChannelType.Push);
    if (value.sms ?? channels.sms) result.push(NotificationChannelType.Sms);
    return result;
  };

  for (const moduleName of ['task', 'goal', 'schedule', 'reminder', 'account', 'system']) {
    settings.set(moduleName, mapEnabledChannels(categories[moduleName]));
  }

  return NotificationPreference.load({
    id: row.id as any,
    identityId: row.identityId as any,
    settings,
    version: row.version,
    deletedAt: row.deletedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

// ============================================================
// Mappers: Domain → Prisma
// ============================================================

function serializePreference(preference: NotificationPreference) {
  const dto = preference.toServerDTO();

  const channels: Record<string, boolean> = {
    inApp: false,
    email: false,
    push: false,
    sms: false,
  };
  const categories: Record<string, Record<string, boolean>> = {};

  for (const [moduleName, moduleChannels] of Object.entries(dto.settings)) {
    const categoryChannels = {
      inApp: moduleChannels.includes(NotificationChannelType.InApp),
      email: moduleChannels.includes(NotificationChannelType.Email),
      push: moduleChannels.includes(NotificationChannelType.Push),
      sms: moduleChannels.includes(NotificationChannelType.Sms),
    };
    categories[moduleName] = categoryChannels;
    channels.inApp ||= categoryChannels.inApp;
    channels.email ||= categoryChannels.email;
    channels.push ||= categoryChannels.push;
    channels.sms ||= categoryChannels.sms;
  }

  const enabled = Object.values(categories).some((value) => Object.values(value).some(Boolean));

  return {
    dto,
    enabled,
    channels: JSON.stringify(channels),
    categories: JSON.stringify(categories),
  };
}

/**
 * NotificationPreference Prisma Repository
 */
export class NotificationPreferencePrismaRepository implements INotificationPreferenceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(preference: NotificationPreference): Promise<void> {
    const { dto, enabled, channels, categories } = serializePreference(preference);

    await this.prisma.notificationPreference.upsert({
      where: { identityId: String(dto.identityId) },
      create: {
        id: String(dto.id),
        identityId: String(dto.identityId),
        enabled,
        channels,
        categories,
        version: dto.version,
        deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
      },
      update: {
        enabled,
        channels,
        categories,
        version: dto.version,
        deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
      },
    });
  }

  async findById(id: string): Promise<NotificationPreference | null> {
    const row = await this.prisma.notificationPreference.findUnique({
      where: { id },
    });
    if (!row) return null;
    return mapPrismaPreferenceToDomain(row as unknown as PrismaNotificationPreference);
  }

  async findByIdentityId(identityId: string): Promise<NotificationPreference | null> {
    const row = await this.prisma.notificationPreference.findUnique({
      where: { identityId },
    });
    if (!row) return null;
    return mapPrismaPreferenceToDomain(row as unknown as PrismaNotificationPreference);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.notificationPreference.delete({ where: { id } });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.notificationPreference.count({ where: { id } });
    return count > 0;
  }

  async existsForIdentity(identityId: string): Promise<boolean> {
    const count = await this.prisma.notificationPreference.count({ where: { identityId } });
    return count > 0;
  }

  async getOrCreate(identityId: string): Promise<NotificationPreference> {
    const existing = await this.findByIdentityId(identityId);
    if (existing) return existing;

    const now = new Date();
    const preference = NotificationPreference.load({
      id: generateUUID() as any,
      identityId: identityId as any,
      settings: new Map([
        ['task', [NotificationChannelType.InApp]],
        ['goal', [NotificationChannelType.InApp]],
        ['schedule', [NotificationChannelType.InApp]],
        ['reminder', [NotificationChannelType.InApp]],
        ['account', [NotificationChannelType.InApp]],
        ['system', [NotificationChannelType.InApp]],
      ]),
      version: 1,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    });

    await this.save(preference);
    return preference;
  }
}
