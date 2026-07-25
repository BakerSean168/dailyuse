import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { AuthChannels } from '@dailyuse/contracts/electron';

/**
 * Desktop auth shell surface (stage-6 residual):
 * Channel registration must use contracts AuthChannels only — no dual-track local Ch map —
 * and remaining read/lifecycle handlers return IpcResult envelopes.
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

  it('returns IpcResult envelopes for previously raw dual-track handlers', () => {
    expect(source).toContain('toIpcResult(ok(status))');
    expect(source).toContain('toIpcResult(ok(snapshot))');
    expect(source).toContain('toIpcResult(ok(await service.initialize()))');
    expect(source).toContain('toIpcResult(ok({ ok: true, authenticated: false }))');
    expect(source).toContain('toIpcResult(ok(mapRememberedAccounts(accounts)))');
    expect(source).toContain('toIpcResult(ok(service ? await service.getCurrentUser() : null))');
    expect(source).toContain(
      'toIpcResult(ok(service ? await service.listSessions() : { sessions: [] }))',
    );
    expect(source).not.toMatch(/return service \? await service\.getStatus\(\)/);
    expect(source).not.toMatch(/return \{ ok: true, authenticated: false \};/);
  });
});
