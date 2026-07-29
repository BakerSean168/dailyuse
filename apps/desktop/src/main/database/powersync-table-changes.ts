import { PowerSyncAppSchema } from '@memoflow/powersync-schema';

export const POWER_SYNC_CHANGE_TABLES = Object.freeze(Object.keys(PowerSyncAppSchema.props));

export function normalizePowerSyncTableName(table: string): string {
  return table.replace(/^ps_data(?:_local)?__/, '');
}
