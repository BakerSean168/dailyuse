import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SettingChannels } from '@memoflow/contracts/electron';

/**
 * Setting electron seam surface (stage-6 residual):
 * Channel registration must use contracts SettingChannels only — no dual-track local Ch map.
 */
describe('SettingElectronModule channel surface', () => {
  const source = readFileSync(resolve(__dirname, 'index.ts'), 'utf8');

  it('registers handlers via SettingChannels and does not redefine a local Ch map', () => {
    expect(source).toContain('SettingChannels');
    expect(source).toContain("from '@memoflow/contracts/electron'");
    expect(source).not.toMatch(/const Ch = \{/);
    expect(source).toContain('Object.values(SettingChannels)');
    expect(source).toContain('SettingChannels.GET_ALL');
    expect(source).toContain('SettingChannels.PATCH');
    expect(source).toContain('SettingChannels.EXPORT');
  });

  it('keeps SettingChannels values aligned with live adapter surface', () => {
    expect(SettingChannels.GET_ALL).toBe('setting:all');
    expect(SettingChannels.PATCH).toBe('setting:patch');
    expect(SettingChannels.RESET).toBe('setting:reset');
    expect(SettingChannels.IMPORT).toBe('setting:import');
    expect(SettingChannels.EXPORT).toBe('setting:export');
  });
});
