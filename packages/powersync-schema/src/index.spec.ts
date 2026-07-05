import { describe, expect, it } from 'vitest';

import { PowerSyncAppSchema } from './index';

function getColumnType(tableName: keyof typeof PowerSyncAppSchema.props, columnName: string) {
  const table = PowerSyncAppSchema.props[tableName];
  const column = table.columns.find((entry) => entry.name === columnName);
  return column?.type;
}

describe('PowerSyncAppSchema', () => {
  it('keeps the key sync tables in the exported schema', () => {
    expect(PowerSyncAppSchema.props).toHaveProperty('task_templates');
    expect(PowerSyncAppSchema.props).toHaveProperty('schedule_tasks');
    expect(PowerSyncAppSchema.props).toHaveProperty('notifications');
    expect(PowerSyncAppSchema.props).toHaveProperty('repositories');
    expect(PowerSyncAppSchema.tables).toHaveLength(Object.keys(PowerSyncAppSchema.props).length);
  });

  it('preserves critical task and schedule column types', () => {
    expect(getColumnType('task_templates', 'goal_binding')).toBe('TEXT');
    expect(getColumnType('task_templates', 'reminder_config_enabled')).toBe('INTEGER');
    expect(getColumnType('schedule_tasks', 'payload')).toBe('TEXT');
    expect(getColumnType('schedule_tasks', 'enabled')).toBe('INTEGER');
  });

  it('keeps notification and repository payload columns serialized as text', () => {
    expect(getColumnType('notifications', 'metadata')).toBe('TEXT');
    expect(getColumnType('notifications', 'is_read')).toBe('INTEGER');
    expect(getColumnType('repositories', 'config')).toBe('TEXT');
    expect(getColumnType('repository_statistics', 'total_size_bytes')).toBe('INTEGER');
  });
});
