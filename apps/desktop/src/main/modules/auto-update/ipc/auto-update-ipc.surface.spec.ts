import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { AutoUpdateChannels } from '@dailyuse/contracts/electron';

/**
 * Auto-update IPC handler surface (stage-6 residual):
 * Registers via contracts AutoUpdateChannels and returns Result ok/fail envelopes
 * (no { success } dual-track response shape).
 */
describe('auto-update IPC channel surface', () => {
  const source = readFileSync(resolve(__dirname, 'index.ts'), 'utf8');

  it('registers handlers via AutoUpdateChannels only', () => {
    expect(source).toContain("import { AutoUpdateChannels } from '@dailyuse/contracts/electron'");
    expect(source).toContain('AutoUpdateChannels.CHECK');
    expect(source).toContain('AutoUpdateChannels.DOWNLOAD');
    expect(source).toContain('AutoUpdateChannels.INSTALL');
    expect(source).toContain('AutoUpdateChannels.STATUS');
    expect(source).toContain('AutoUpdateChannels.CONFIG');
    expect(source).not.toMatch(/ipcMain\.handle\(\s*'auto-update:/);
  });

  it('returns contracts Result ok/fail envelopes instead of { success } dual-track', () => {
    expect(source).toContain("import { fail, ok } from '@dailyuse/contracts/result'");
    expect(source).toContain('return ok(');
    expect(source).toContain('return fail({');
    expect(source).not.toMatch(/success:\s*true/);
    expect(source).not.toMatch(/success:\s*false/);
  });

  it('keeps contracts channel values aligned with live handler surface', () => {
    expect(AutoUpdateChannels.CHECK).toBe('auto-update:check');
    expect(Object.values(AutoUpdateChannels)).toEqual([
      'auto-update:check',
      'auto-update:download',
      'auto-update:install',
      'auto-update:status',
      'auto-update:config',
    ]);
  });
});
