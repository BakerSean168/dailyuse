import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Desktop auth recovery surface (stage-6 residual 72):
 * GET_STATUS/INITIALIZE use IpcResult envelopes; recovery unwraps status data.
 */
describe('desktop-auth-recovery Result surface', () => {
  const source = readFileSync(resolve(__dirname, 'desktop-auth-recovery.ts'), 'utf8');

  it('unwraps GET_STATUS IpcResult envelopes', () => {
    expect(source).toContain(
      "import { fromIpcResult, isOk, type IpcResult } from '@dailyuse/contracts/result'",
    );
    expect(source).toContain('fromIpcResult(response)');
    expect(source).toContain('AuthChannels.GET_STATUS');
    expect(source).toContain('AuthChannels.INITIALIZE');
    expect(source).not.toContain(') as DesktopAuthStatus;');
  });
});
