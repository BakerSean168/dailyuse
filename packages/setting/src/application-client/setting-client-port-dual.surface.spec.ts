import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 280: SettingClientPort is a type alias of ISettingApiClient
 * (no second interface dual body; importSettings options pass through).
 */
describe('setting client port dual single-track surface', () => {
  const application = readFileSync(resolve(__dirname, 'index.ts'), 'utf8');
  const port = readFileSync(resolve(__dirname, 'ports/setting-api-client.port.ts'), 'utf8');

  it('defines ISettingApiClient once in ports', () => {
    expect(port).toContain('export interface ISettingApiClient');
    expect(port).toContain('options?: { merge?: boolean }');
  });

  it('SettingClientPort is type alias, not a second interface', () => {
    expect(application).toMatch(/export type SettingClientPort\s*=\s*ISettingApiClient/);
    expect(application).not.toMatch(/export interface SettingClientPort\s*\{/);
    expect(application).toContain('implements ISettingApiClient');
    expect(application).toContain('options?: { merge?: boolean }');
  });
});
