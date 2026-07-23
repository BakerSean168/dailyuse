import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 905: reminder DesktopApi dual retired.
 * ReminderContext uses DesktopAuthApi sole invoke-api shape (no local dual object type).
 * Residual 903 (soft): DesktopBootstrapApi dual retired
 *   (shared/utils/desktop-bootstrap-api-dual.surface.spec.ts).
 * Does not flip §13.2 checkboxes.
 */
describe('reminder DesktopApi dual retired (residual 905)', () => {
  const composableDir = __dirname;
  const context = readFileSync(resolve(composableDir, 'useReminderContext.ts'), 'utf8');
  const recovery = readFileSync(
    resolve(composableDir, '../../../shared/utils/desktop-auth-recovery.ts'),
    'utf8',
  );

  it('imports DesktopAuthApi and types ReminderContext.desktopApi from it', () => {
    expect(context).toContain('Residual 905');
    expect(context).toContain(
      "import type { DesktopAuthApi } from '../../../shared/utils/desktop-auth-recovery'",
    );
    expect(context).toContain('desktopApi: DesktopAuthApi | undefined');
    expect(context).not.toMatch(/type DesktopApi\s*=/);
    expect(context).not.toMatch(/interface DesktopApi\b/);
    expect(context).not.toContain('desktopApi: DesktopApi');
  });

  it('keeps sole DesktopAuthApi object-type body in recovery module', () => {
    expect(recovery).toContain('Residual 905');
    expect(recovery).toContain('Residual 903');
    expect(recovery).toMatch(/export type DesktopAuthApi = \{/);
    expect(recovery).toContain(
      'invoke?: (channel: string, ...args: unknown[]) => Promise<unknown>',
    );
  });

  it('reminder context still injects DESKTOP_AUTH_API_KEY into executeDesktopAuthenticatedResult', () => {
    expect(context).toContain('DESKTOP_AUTH_API_KEY');
    expect(context).toContain('inject(DESKTOP_AUTH_API_KEY, undefined)');
    expect(context).toContain('executeDesktopAuthenticatedResult');
    expect(context).toContain('desktopApi,');
  });
});
