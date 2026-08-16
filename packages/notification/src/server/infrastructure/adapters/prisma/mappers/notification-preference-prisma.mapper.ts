// Residual 1025: sole parseJsonSafe (local dual retired).
import { parseJsonSafe } from '@memoflow/utils/shared';
/**
 * NotificationPreferencePrismaMapper — Bidirectional mapping between Prisma rows and domain NotificationPreference.
 * NotificationPreferencePrismaMapper —— Prisma 行数据与领域 NotificationPreference 之间的双向映射。
 *
 * Handles the complex decomposition of domain settings Map into Prisma channels/categories JSON columns:
 * 处理领域 settings Map 到 Prisma channels/categories JSON 列的复杂分解：
 * - Domain: Map<moduleName, NotificationChannelType[]>
 * - Prisma: channels (global channel booleans) + categories (per-module channel booleans)
 *
 * @internal Persistence mapper — not part of the public API.
 * @internal 持久化映射器 — 非公开 API。
 */

import { NotificationPreference } from '../../../../domain/aggregates/notification-preference';
import { NotificationChannelType } from '@memoflow/contracts/notification';

// Prisma row type (matches the raw query result)
export type PrismaNotificationPreferenceRow = {
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

/**
 * Structural row input for `toDomain`. The generated Prisma row is a structural
 * superset (extra columns), so this widens the accepted input to any object
 * carrying the mapped fields — removing the the raw cast boundary casts at
 * the repository call sites.
 * `toDomain` 的结构化行输入。生成的 Prisma row 是结构超集（额外的列），因此
 * 放宽接受的输入为任何携带被映射字段的对象——消除 repository 调用点的
 * the raw cast 边界强转。
 */
export type NotificationPreferenceRowLike = Pick<
  PrismaNotificationPreferenceRow,
  | 'id'
  | 'identityId'
  | 'enabled'
  | 'channels'
  | 'categories'
  | 'version'
  | 'createdAt'
  | 'updatedAt'
  | 'deletedAt'
>;

/**
 * Safely parses a JSON string, returning null on failure.
 * 安全解析 JSON 字符串，失败时返回 null。
 */

export class NotificationPreferencePrismaMapper {
  /**
   * Converts a Prisma row to a domain NotificationPreference aggregate.
   * 将 Prisma 行数据转换为领域 NotificationPreference 聚合根。
   *
   * Reconstructs the settings Map from per-module channel booleans.
   * 从各模块的渠道布尔值重建 settings Map。
   *
   * @param row - Prisma NotificationPreference row  Prisma NotificationPreference 行数据
   * @returns Hydrated NotificationPreference aggregate 水合后的 NotificationPreference 聚合根
   */
  static toDomain(row: NotificationPreferenceRowLike): NotificationPreference {
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
      id: row.id as never,
      identityId: row.identityId as never,
      settings,
      version: row.version,
      deletedAt: row.deletedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  /**
   * Converts a domain NotificationPreference aggregate to Prisma write format.
   * 将领域 NotificationPreference 聚合根转换为 Prisma 写入格式。
   *
   * Decomposes the settings Map into:
   * - channels: global channel booleans (OR of all modules)
   * - categories: per-module channel booleans
   * - enabled: whether any channel is active
   *
   * 将 settings Map 分解为：
   * - channels：全局渠道布尔值（所有模块的 OR 结果）
   * - categories：各模块的渠道布尔值
   * - enabled：是否有任何渠道激活
   *
   * @param preference - Domain NotificationPreference aggregate
   * @returns Object with dto, enabled flag, and serialized JSON strings
   */
  static toPersistence(preference: NotificationPreference) {
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
}
