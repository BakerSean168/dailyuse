import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { WindowChannels } from '@dailyuse/contracts/electron';

/**
 * Window manager IPC surface (stage-6 residual):
 * Handlers register via WindowChannels and return Result ok/fail — no { success } dual-track.
 */
describe('window-manager IPC channel surface', () => {
  const source = readFileSync(resolve(__dirname, 'window-manager.ts'), 'utf8');

  it('registers window handlers via WindowChannels', () => {
    expect(source).toContain('WindowChannels.TRANSITION_TO_MAIN');
    expect(source).toContain('WindowChannels.MINIMIZE');
    expect(source).toContain('WindowChannels.GET_CONTROLS_STATE');
    expect(WindowChannels.CLOSE).toBe('window:close');
  });

  it('returns contracts Result ok/fail envelopes instead of { success } dual-track', () => {
    expect(source).toContain("import { fail, ok } from '@dailyuse/contracts/result'");
    expect(source).toContain('return ok(');
    expect(source).toContain('return fail({');
    // Restrict to registerIpcHandlers body: no success: true/false returns
    const start = source.indexOf('private registerIpcHandlers');
    const end = source.indexOf('cleanup():', start);
    const handlers = source.slice(start, end);
    expect(handlers).not.toMatch(/success:\s*true/);
    expect(handlers).not.toMatch(/success:\s*false/);
  });
});
