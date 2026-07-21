import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { AccountChannels } from '@dailyuse/contracts/electron';

/**
 * Account electron seam surface (stage-6 residual):
 * Channel registration must use contracts AccountChannels only — no dual-track local Ch map
 * and no triple get-profile aliases.
 */
describe('AccountElectronModule channel surface', () => {
  const source = readFileSync(resolve(__dirname, 'index.ts'), 'utf8');

  it('registers handlers via AccountChannels and does not redefine a local Ch map', () => {
    expect(source).toContain('AccountChannels');
    expect(source).toContain("from '@dailyuse/contracts/electron'");
    expect(source).not.toMatch(/const Ch = \{/);
    expect(source).toContain('Object.values(AccountChannels)');
    expect(source).toContain('AccountChannels.GET_ME');
    expect(source).toContain('AccountChannels.UPDATE_PROFILE');
    expect(source).toContain('AccountChannels.CLOSE');
  });

  it('registers only the live get-profile channel', () => {
    expect(source).toContain('AccountChannels.GET_ME');
    expect(source).not.toContain("'account:get'");
    expect(source).not.toContain("'account:current'");
    expect(source).not.toContain("'account:list'");
    expect(AccountChannels.GET_ME).toBe('account:get-me');
    expect(Object.values(AccountChannels)).not.toContain('account:get');
    expect(Object.values(AccountChannels)).not.toContain('account:current');
    expect(Object.values(AccountChannels)).not.toContain('account:list');
  });
});
