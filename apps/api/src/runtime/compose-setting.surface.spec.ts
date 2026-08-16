import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Setting API runtime composer surface.
 * 设置 API runtime composer 表面契约。
 *
 * Locks the Step C wiring: apps/api/src/server.ts must compose setting through the
 * runtime composer and must no longer reference the retired `SettingApiModule`
 * constant or the `@memoflow/setting/api` seam. The composer must only touch the
 * narrow seams the plan allows.
 *
 * 锁定 Step C 接线：apps/api/src/server.ts 必须通过 runtime composer 组装设置，
 * 且不再引用已退役的 `SettingApiModule` 常量或 `@memoflow/setting/api` seam。
 * composer 只允许接触计划允许的窄 seam。
 */
describe('setting API runtime composer surface', () => {
  const dir = resolve(__dirname, '..');
  const server = readFileSync(resolve(dir, 'server.ts'), 'utf8');
  const composer = readFileSync(resolve(dir, 'runtime/compose-setting.ts'), 'utf8');

  it('server.ts composes setting via composeSetting({ db: prisma })', () => {
    expect(server).toContain("from './runtime/compose-setting'");
    expect(server).toMatch(/composeSetting\(\{\s*db: prisma,?\s*\}/);
    expect(server).toContain('.register(settingApiModule)');
  });

  it('server.ts no longer references SettingApiModule or the setting/api seam', () => {
    expect(server).not.toMatch(/\bSettingApiModule\b/);
    expect(server).not.toContain("from '@memoflow/setting/api'");
  });

  it('composer only touches the narrow seams (no deep server import)', () => {
    expect(composer).toContain('interface ComposeSettingDependencies');
    expect(composer).toContain("from '@memoflow/setting'");
    expect(composer).toContain("from '@memoflow/setting/api'");
    expect(composer).not.toMatch(/@memoflow\/setting\/server/);
  });
});
