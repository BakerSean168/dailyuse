import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Dual-track setting enum / definition VOs (stage-6 residual 203):
 * After Zod-first UserPreferencesSchema and packages/editor retirement, parallel
 * const-enum VOs must stay deleted. Preference field enums live only in
 * preference schemas.
 */
describe('retired dual-track setting enum value objects surface', () => {
  const voDir = resolve(__dirname);
  const indexSource = readFileSync(resolve(voDir, 'index.ts'), 'utf8');
  const domainVoDir = resolve(
    __dirname,
    '../../../../../../packages/setting/src/server/domain/value-objects',
  );
  const domainIndex = readFileSync(resolve(domainVoDir, 'index.ts'), 'utf8');

  const retiredFiles = [
    'font-size.ts',
    'theme-mode.ts',
    'time-format.ts',
    'task-view-type.ts',
    'goal-view-type.ts',
    'schedule-view-type.ts',
    'profile-visibility.ts',
    'setting-category.ts',
    'setting-definition.ts',
    'setting-scope.ts',
    'setting-value-type.ts',
    'ui-input-type.ts',
    'ui-config.ts',
    'sync-config.ts',
    'operator-type.ts',
    'validation-rule.ts',
  ] as const;

  it('contracts value-objects barrel only re-exports SettingId primitives', () => {
    expect(indexSource).toContain(
      "export type { SettingId, SettingGroupId } from '../../../primitives'",
    );
    expect(indexSource).not.toMatch(/export \{[^}]*FontSize/);
    expect(indexSource).not.toMatch(/export \{[^}]*ThemeMode/);
    expect(indexSource).not.toMatch(/export type \{[^}]*UIConfig/);
    expect(indexSource).not.toMatch(/from '\.\/font-size'/);
    expect(indexSource).not.toMatch(/from '\.\/theme-mode'/);
    expect(indexSource).not.toMatch(/from '\.\/setting-definition'/);
  });

  it('retired dual-track VO source files stay deleted on contracts and domain', () => {
    for (const file of retiredFiles) {
      expect(existsSync(resolve(voDir, file))).toBe(false);
      expect(existsSync(resolve(domainVoDir, file))).toBe(false);
    }
    expect(existsSync(resolve(domainVoDir, 'setting-id.ts'))).toBe(true);
    expect(domainIndex).toContain("export { SettingId } from './setting-id'");
    expect(domainIndex).not.toMatch(/from '\.\/font-size'/);
    expect(domainIndex).not.toMatch(/from '\.\/theme-mode'/);
  });
});
