import { describe, expect, it } from 'vitest';
import { PowerSyncAppSchema } from '@memoflow/powersync-schema';
import { normalizePowerSyncTableName, POWER_SYNC_CHANGE_TABLES } from '../powersync-table-changes';

describe('PowerSync table change configuration', () => {
  it('watches every table declared by the shared PowerSync schema', () => {
    expect(POWER_SYNC_CHANGE_TABLES).toEqual(Object.keys(PowerSyncAppSchema.props));
    expect(POWER_SYNC_CHANGE_TABLES).toContain('goals');
  });

  it.each([
    ['goals', 'goals'],
    ['ps_data__goals', 'goals'],
    ['ps_data_local__goals', 'goals'],
  ])('normalizes %s to the renderer table name %s', (physicalName, logicalName) => {
    expect(normalizePowerSyncTableName(physicalName)).toBe(logicalName);
  });
});
