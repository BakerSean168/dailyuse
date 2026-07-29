import { generateUUID } from '@memoflow/utils/shared';
import type { IElectronDatabase } from '@memoflow/contracts/electron';
import { NotificationChannelType } from '@memoflow/contracts/notification';
import { NotificationPreference } from '../../../domain/aggregates/notification-preference';
import type { INotificationPreferenceRepository } from '../../../domain/repositories/i-notification-preference-repository';

interface NotificationPreferenceRow {
  id: string;
  identity_id: string;
  channels: string | null;
  categories: string | null;
  enabled: number | null;
  version: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

function toSettings(
  row: NotificationPreferenceRow,
): Record<string, (typeof NotificationChannelType)[keyof typeof NotificationChannelType][]> {
  const channels = row.channels ? (JSON.parse(row.channels) as Record<string, boolean>) : {};
  const categories = row.categories
    ? (JSON.parse(row.categories) as Record<string, Record<string, boolean> | boolean>)
    : {};
  const enabled = row.enabled !== 0;
  const settings: Record<
    string,
    (typeof NotificationChannelType)[keyof typeof NotificationChannelType][]
  > = {};

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
    settings[moduleName] = mapEnabledChannels(categories[moduleName]);
  }

  return settings;
}

function hydratePreference(row: NotificationPreferenceRow): NotificationPreference {
  return NotificationPreference.load({
    id: row.id as never,
    identityId: row.identity_id as never,
    settings: new Map(Object.entries(toSettings(row))),
    version: row.version ?? 1,
    deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  });
}

function serializePreference(preference: NotificationPreference) {
  const dto = preference.toServerDTO();
  const channels = {
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

  return {
    dto,
    enabled: Object.values(categories).some((value) => Object.values(value).some(Boolean)) ? 1 : 0,
    channels: JSON.stringify(channels),
    categories: JSON.stringify(categories),
  };
}

export class PowerSyncNotificationPreferenceRepository implements INotificationPreferenceRepository {
  constructor(private readonly db: IElectronDatabase) {}

  async save(preference: NotificationPreference): Promise<void> {
    const { dto, enabled, channels, categories } = serializePreference(preference);
    await this.db.execute(
      `INSERT OR REPLACE INTO notification_preferences (
         id, identity_id, enabled, channels, categories, version, created_at, updated_at, deleted_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        dto.id,
        dto.identityId,
        enabled,
        channels,
        categories,
        dto.version,
        new Date(dto.createdAt).toISOString(),
        new Date(dto.updatedAt).toISOString(),
        dto.deletedAt ? new Date(dto.deletedAt).toISOString() : null,
      ],
    );
  }

  async findByIdForIdentity(identityId: string, id: string): Promise<NotificationPreference | null> {
    const row = await this.db.getOptional<NotificationPreferenceRow>(
      `SELECT * FROM notification_preferences WHERE id = ? AND identity_id = ? LIMIT 1`,
      [id, identityId],
    );
    return row ? hydratePreference(row) : null;
  }

  async findByIdentityId(identityId: string): Promise<NotificationPreference | null> {
    const row = await this.db.getOptional<NotificationPreferenceRow>(
      `SELECT * FROM notification_preferences WHERE identity_id = ? LIMIT 1`,
      [identityId],
    );
    return row ? hydratePreference(row) : null;
  }

  async delete(identityId: string, id: string): Promise<void> {
    const existing = await this.findByIdForIdentity(identityId, id);
    if (!existing) {
      throw new Error('Notification preference not found for the current identity.');
    }
    await this.db.execute(
      `DELETE FROM notification_preferences WHERE id = ? AND identity_id = ?`,
      [id, identityId],
    );
  }

  async exists(identityId: string, id: string): Promise<boolean> {
    return (await this.findByIdForIdentity(identityId, id)) !== null;
  }

  async existsForIdentity(identityId: string): Promise<boolean> {
    return (await this.findByIdentityId(identityId)) !== null;
  }

  async getOrCreate(identityId: string): Promise<NotificationPreference> {
    const existing = await this.findByIdentityId(identityId);
    if (existing) return existing;

    const now = new Date();
    const preference = NotificationPreference.load({
      id: generateUUID() as never,
      identityId: identityId as never,
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
