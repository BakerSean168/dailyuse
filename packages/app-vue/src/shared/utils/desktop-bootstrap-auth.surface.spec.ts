import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Desktop bootstrap auth surface (stage-6 residual 72):
 * GET_BOOTSTRAP_SNAPSHOT returns IpcResult; hydrate unwraps via fromIpcResult.
 * Residual 903 (soft): DesktopBootstrapApi dual retired
 *   (desktop-bootstrap-api-dual.surface.spec.ts).
 */
describe('desktop-bootstrap-auth Result surface', () => {
  const source = readFileSync(resolve(__dirname, 'desktop-bootstrap-auth.ts'), 'utf8');

  it('unwraps bootstrap snapshot IpcResult envelopes', () => {
    expect(source).toContain(
      "import { fromIpcResult, isOk, type IpcResult } from '@memoflow/contracts/result'",
    );
    expect(source).toContain('fromIpcResult(response)');
    expect(source).toContain('isOk(result)');
    expect(source).toContain('AuthChannels.GET_BOOTSTRAP_SNAPSHOT');
    expect(source).not.toContain(') as AuthBootstrapSnapshot;');
  });
});
