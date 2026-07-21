import { describe, expect, it } from 'vitest';
import * as powersyncPublic from '../index';

describe('desktop PowerSync public surface', () => {
  it('exposes only the profile-runtime entrypoints (no dual-track connect/promote/wipe shims)', () => {
    expect(Object.keys(powersyncPublic).sort()).toEqual(
      [
        'ensurePowerSyncSyncMode',
        'getPowerSyncDatabase',
        'openPowerSyncLocalOnly',
        'shutdownPowerSync',
      ].sort(),
    );
    expect(powersyncPublic).not.toHaveProperty('connectPowerSync');
    expect(powersyncPublic).not.toHaveProperty('disconnectPowerSync');
    expect(powersyncPublic).not.toHaveProperty('promotePowerSyncToSync');
  });
});
