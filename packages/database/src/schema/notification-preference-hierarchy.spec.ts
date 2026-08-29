import { describe, expect, it, vi } from 'vitest';
import {
  migrateLegacyNotificationPreference,
  prepareNotificationPreferenceHierarchy,
  type NotificationPreferenceSchemaQueryClient,
} from './notification-preference-hierarchy';

function result(rows: Array<Record<string, unknown>>) {
  return { rows, rowCount: rows.length };
}

describe('migrateLegacyNotificationPreference', () => {
  it('preserves the real legacy module behavior without promoting OR-derived channels to global preferences', () => {
    const migrated = migrateLegacyNotificationPreference({
      enabled: true,
      channels: JSON.stringify({ inApp: true, email: false, push: false, sms: false }),
      categories: JSON.stringify({
        task: { inApp: true, email: false, push: false, sms: false },
        goal: { inApp: true, email: false, push: false, sms: false },
        schedule: { inApp: true, email: false, push: false, sms: false },
        reminder: { inApp: true, email: false, push: false, sms: false },
        account: { inApp: true, email: false, push: false, sms: false },
        system: { inApp: true, email: false, push: false, sms: false },
      }),
    });

    expect(migrated.globalChannels).toEqual({});
    expect(migrated.workflowOverrides).toEqual(
      Object.fromEntries(
        ['task', 'goal', 'schedule', 'reminder', 'account', 'system'].map((moduleName) => [
          `${moduleName}.general`,
          { InApp: true, Email: false, Push: false, Sms: false },
        ]),
      ),
    );
  });

  it('uses the legacy global OR summary only as a fallback for missing category channel keys', () => {
    const migrated = migrateLegacyNotificationPreference({
      enabled: true,
      channels: { inApp: true, email: true, push: false, sms: false },
      categories: { task: { inApp: false } },
    });

    expect(migrated.workflowOverrides['task.general']).toEqual({
      InApp: false,
      Email: true,
      Push: false,
      Sms: false,
    });
    expect(migrated.workflowOverrides['goal.general']).toEqual({
      InApp: false,
      Email: false,
      Push: false,
      Sms: false,
    });
  });

  it('preserves the legacy master disable across every vNext configurable channel', () => {
    expect(
      migrateLegacyNotificationPreference({
        enabled: false,
        channels: { inApp: true, email: true, push: true, sms: true },
        categories: { task: { inApp: true } },
      }),
    ).toEqual({
      globalChannels: {
        InApp: false,
        Email: false,
        Push: false,
        Desktop: false,
        Sms: false,
        Webhook: false,
      },
      workflowOverrides: {},
    });
  });

  it('treats invalid legacy JSON as the old mapper did: no enabled module channels', () => {
    const migrated = migrateLegacyNotificationPreference({
      enabled: true,
      channels: '{broken',
      categories: '{broken',
    });

    expect(migrated.globalChannels).toEqual({});
    expect(migrated.workflowOverrides['task.general']).toEqual({
      InApp: false,
      Email: false,
      Push: false,
      Sms: false,
    });
  });
});

describe('prepareNotificationPreferenceHierarchy', () => {
  it('leaves a fresh database for Prisma to initialize', async () => {
    const query = vi.fn().mockResolvedValue(result([{ regclass: null }]));

    await expect(
      prepareNotificationPreferenceHierarchy({ query } as NotificationPreferenceSchemaQueryClient),
    ).resolves.toEqual({
      tablePresent: false,
      legacyColumns: [],
      rowsScanned: 0,
      rowsMigrated: 0,
    });
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('adds vNext columns, migrates legacy rows transactionally, and preserves existing new values on retry', async () => {
    const query = vi
      .fn()
      .mockResolvedValueOnce(result([{ regclass: 'notification_preferences' }]))
      .mockResolvedValueOnce(
        result([
          { column_name: 'id' },
          { column_name: 'enabled' },
          { column_name: 'channels' },
          { column_name: 'categories' },
        ]),
      )
      .mockResolvedValueOnce(result([]))
      .mockResolvedValueOnce(result([]))
      .mockResolvedValueOnce(
        result([
          {
            id: 'legacy-1',
            enabled: true,
            channels: '{"inApp":true,"email":false,"push":false,"sms":false}',
            categories: '{"task":{"inApp":true,"email":false,"push":false,"sms":false}}',
            global_channels: '{}',
            workflow_overrides: '{}',
          },
          {
            id: 'vnext-1',
            enabled: true,
            channels: '{}',
            categories: '{}',
            global_channels: '{"Email":false}',
            workflow_overrides: '{}',
          },
        ]),
      )
      .mockResolvedValueOnce(result([]))
      .mockResolvedValueOnce(result([]));

    const report = await prepareNotificationPreferenceHierarchy({
      query,
    } as NotificationPreferenceSchemaQueryClient);

    expect(report).toEqual({
      tablePresent: true,
      legacyColumns: ['enabled', 'channels', 'categories'],
      rowsScanned: 2,
      rowsMigrated: 1,
    });
    const updateCall = query.mock.calls.find(([sql]) =>
      String(sql).includes('UPDATE notification_preferences'),
    );
    expect(updateCall?.[1]?.[0]).toBe('{}');
    expect(JSON.parse(String(updateCall?.[1]?.[1]))['task.general']).toEqual({
      InApp: true,
      Email: false,
      Push: false,
      Sms: false,
    });
    expect(updateCall?.[1]?.[2]).toBe('legacy-1');
    expect(query.mock.calls.some(([sql]) => String(sql) === 'COMMIT')).toBe(true);
  });

  it('rolls back when a legacy row update fails', async () => {
    const query = vi
      .fn()
      .mockResolvedValueOnce(result([{ regclass: 'notification_preferences' }]))
      .mockResolvedValueOnce(
        result([
          { column_name: 'id' },
          { column_name: 'enabled' },
          { column_name: 'channels' },
          { column_name: 'categories' },
        ]),
      )
      .mockResolvedValueOnce(result([]))
      .mockResolvedValueOnce(result([]))
      .mockResolvedValueOnce(
        result([
          {
            id: 'legacy-1',
            enabled: true,
            channels: '{}',
            categories: '{}',
            global_channels: '{}',
            workflow_overrides: '{}',
          },
        ]),
      )
      .mockRejectedValueOnce(new Error('write failed'))
      .mockResolvedValueOnce(result([]));

    await expect(
      prepareNotificationPreferenceHierarchy({ query } as NotificationPreferenceSchemaQueryClient),
    ).rejects.toThrow('write failed');
    expect(query.mock.calls.at(-1)?.[0]).toBe('ROLLBACK');
  });
});
