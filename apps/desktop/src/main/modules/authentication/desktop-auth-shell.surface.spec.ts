import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { AuthChannels } from '@dailyuse/contracts/electron';

/**
 * Desktop auth shell surface (stage-6 residual):
 * Channel registration must use contracts AuthChannels only — no dual-track local Ch map.
 */
describe('desktop-auth-shell channel surface', () => {
  const source = readFileSync(resolve(__dirname, 'desktop-auth-shell.ts'), 'utf8');

  it('registers handlers via AuthChannels and does not redefine a local Ch map', () => {
    expect(source).toContain("import { AuthChannels } from '@dailyuse/contracts/electron'");
    expect(source).not.toMatch(/const Ch = \{/);
    expect(source).toContain('Object.values(AuthChannels)');
    expect(source).toContain('AuthChannels.LOGIN');
    expect(source).toContain('AuthChannels.ENTER_GUEST_MODE');
    expect(source).toContain('AuthChannels.SESSION_LIST');
  });

  it('keeps AuthChannels and shell registration values aligned for live login paths', () => {
    expect(AuthChannels.LOGIN).toBe('auth:login');
    expect(AuthChannels.ENTER_GUEST_MODE).toBe('auth:enter-guest-mode');
    expect(AuthChannels.GET_STATUS).toBe('auth:get-status');
    expect(AuthChannels.SESSION_LIST).toBe('auth:session:list');
    expect(AuthChannels.SESSION_REVOKE).toBe('auth:session:revoke');
  });
});
