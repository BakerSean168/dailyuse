import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 657: setting overview dual retired.
 * Setting contracts use UserSettingClientDTO / preference surfaces only.
 *
 * Soft residual 823: UserSettingClientDTO dual retired via UserSettingResponseSchema
 * (see user-setting-client-dto-dual surface; assertion updated below).
 */
describe('setting overview dual single-track surface (residual 657)', () => {
  const dtos = __dirname;
  const aggregates = resolve(dtos, '../aggregates');

  it('drops setting-overview dual source and export', () => {
    const index = readFileSync(resolve(dtos, 'index.ts'), 'utf8');
    expect(existsSync(resolve(dtos, 'setting-overview.dto.ts'))).toBe(false);
    expect(index).toMatch(/Residual 657/);
    expect(index).not.toMatch(/export interface SettingOverviewDTO\b/);
    expect(index).not.toMatch(/setting-overview\.dto/);
    expect(index).not.toMatch(/from '\.\/setting-overview/);
    expect(readdirSync(dtos).sort()).toEqual([
      'index.ts',
      'setting-overview-dual.surface.spec.ts',
    ]);
  });

  it('keeps UserSettingClientDTO as live setting client surface (z.infer)', () => {
    const client = readFileSync(resolve(aggregates, 'user-setting-client.ts'), 'utf8');
    const aggregatesIndex = readFileSync(resolve(aggregates, 'index.ts'), 'utf8');
    expect(client).toContain(
      'export type UserSettingClientDTO = z.infer<typeof UserSettingResponseSchema>',
    );
    expect(client).not.toMatch(/export interface UserSettingClientDTO\b/);
    expect(aggregatesIndex).toContain('UserSettingClientDTO');
  });
});
