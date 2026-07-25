import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 230: no dead getBootstrapper dual-track shutdown accessor chain.
 * Profile bootstrapper lifecycle is owned by profile runtime deactivate/destroy.
 */
describe('desktop bootstrapper access single-track surface', () => {
  const main = readFileSync(resolve(__dirname, 'main.ts'), 'utf8');
  const runtime = readFileSync(resolve(__dirname, 'desktop-main-runtime.ts'), 'utf8');
  const profileManager = readFileSync(
    resolve(__dirname, 'profile/desktop-profile-runtime-manager.ts'),
    'utf8',
  );

  it('does not expose getBootstrapper convenience dual-path', () => {
    expect(main).not.toContain('export function getBootstrapper');
    expect(main).not.toContain('backward-compatible shutdown');
    expect(runtime).not.toContain('getBootstrapper');
    expect(runtime).not.toContain('backward-compatible');
    expect(profileManager).not.toContain('getBootstrapper');
  });
});
