import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Residual 633: SettingOperationRes partial dual envelope is retired.
 * Setting API responses use DTO / Result envelopes only (no { ok, message? }).
 *
 * Soft residual 823: UserSettingClientDTO dual retired via UserSettingResponseSchema
 * (see user-setting-client-dto-dual surface).
 */
const here = dirname(fileURLToPath(import.meta.url));

function read(name: string): string {
  return readFileSync(join(here, name), 'utf8');
}

describe('setting SettingOperationRes dual retired (residual 633)', () => {
  it('user-setting.dto does not define SettingOperationRes dual envelope', () => {
    const source = read('user-setting.dto.ts');
    expect(source).toContain('Residual 633');
    expect(source).not.toMatch(/export interface SettingOperationRes/);
    expect(source).not.toMatch(/SettingOperationRes\s*\{[^}]*ok:\s*boolean/);
    expect(source).toContain('PatchUserSettingRes = UserSettingClientDTO');
    expect(source).toContain('ResetUserSettingRes = UserSettingClientDTO');
    expect(source).toContain('GetUserSettingRes = UserSettingClientDTO');
  });

  it('setting api barrel still exports user-setting DTO surface', () => {
    const index = read('index.ts');
    expect(index).toContain("./user-setting.dto");
  });
});
