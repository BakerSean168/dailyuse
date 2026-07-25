import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 238: authentication PowerSync factory is single-track.
 * Canonical module is infrastructure/powersync.ts — no powersync/ dual barrel.
 */
describe('authentication PowerSync barrel single-track surface', () => {
  const infraDir = __dirname;
  const canonical = resolve(infraDir, 'powersync.ts');
  const dualDir = resolve(infraDir, 'powersync');
  const dualIndex = resolve(infraDir, 'powersync/index.ts');
  const indexSource = readFileSync(resolve(infraDir, 'index.ts'), 'utf8');
  const factorySource = readFileSync(canonical, 'utf8');

  it('keeps powersync.ts factory and drops powersync/ dual barrel', () => {
    expect(existsSync(canonical)).toBe(true);
    expect(existsSync(dualDir)).toBe(false);
    expect(existsSync(dualIndex)).toBe(false);
  });

  it('infrastructure index exports factory from ./powersync (file track)', () => {
    expect(indexSource).toContain("export { createAuthenticationPowerSyncModule } from './powersync'");
    expect(indexSource).not.toContain("from './powersync/index'");
    expect(indexSource).not.toContain("from './powersync/'");
  });

  it('canonical factory owns createAuthenticationPowerSyncModule (no composition-root convenience re-export dual)', () => {
    expect(factorySource).toContain('export function createAuthenticationPowerSyncModule');
    expect(factorySource).toContain("from './authentication.module'");
    expect(factorySource).not.toContain('Re-export composition root types for convenience');
    expect(factorySource).not.toContain('export {\n  createAuthenticationModule');
  });
});
