import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { SettingId } from '../setting-id';

/**
 * Residual 203: dual-track setting enum VOs (FontSize/ThemeMode/TaskViewType/…)
 * were deleted. Preference field enums live only in Zod preference schemas.
 */
describe('setting value objects after dual-track enum retirement', () => {
  const voDir = resolve(__dirname, '..');

  it('keeps SettingId as the live aggregate identity VO', () => {
    const id = SettingId.generate();
    expect(SettingId.is(id)).toBe(true);
    expect(SettingId.of(id)).toBe(id);
  });

  it('does not ship retired dual-track enum / definition VO files', () => {
    for (const file of [
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
    ]) {
      expect(existsSync(resolve(voDir, file))).toBe(false);
    }
  });
});
