import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CATEGORY_SCHEMAS,
  PREFERENCE_CATEGORIES,
  UserPreferencesSchema,
  getDefaultPreferences,
} from './index';

/**
 * Retired in-app editor preference category (stage-6 residual 202 / ADR-034):
 * packages/editor runtime is deleted; Monaco-like editor theme/fontSize/tabSize
 * preferences must not remain as a dual-track settings surface. Portable
 * editor_* backup tables stay in data-portability only.
 */
describe('retired editor preference category surface', () => {
  const repoRoot = resolve(__dirname, '../../../../../../');
  const schemasIndex = readFileSync(resolve(__dirname, 'schemas/index.ts'), 'utf8');
  const mockSetting = readFileSync(
    resolve(repoRoot, 'packages/contracts/src/mocks/setting.mock.ts'),
    'utf8',
  );
  const valueObjectsIndex = readFileSync(
    resolve(__dirname, '../value-objects/index.ts'),
    'utf8',
  );

  it('preference schema and defaults have no editor category', () => {
    expect(existsSync(resolve(__dirname, 'schemas/editor.schema.ts'))).toBe(false);
    expect(schemasIndex).not.toContain('EditorSchema');
    expect(schemasIndex).not.toMatch(/\beditor\b/);
    expect(PREFERENCE_CATEGORIES).not.toContain('editor');
    expect(Object.keys(CATEGORY_SCHEMAS)).not.toContain('editor');
    expect(getDefaultPreferences()).not.toHaveProperty('editor');
    expect(UserPreferencesSchema.parse({})).not.toHaveProperty('editor');
  });

  it('stored editor preference blobs are stripped on parse (no dual-track keep)', () => {
    const parsed = UserPreferencesSchema.parse({
      appearance: { theme: 'dark' },
      editor: {
        theme: 'monokai',
        fontSize: 16,
        tabSize: 4,
        wordWrap: true,
        lineNumbers: true,
        minimap: false,
      },
    } as never);
    expect(parsed).not.toHaveProperty('editor');
    expect(parsed.appearance.theme).toBe('dark');
  });

  it('mock generators drop editor blobs; packages/editor stays deleted', () => {
    expect(mockSetting).not.toMatch(/\beditor:\s*\{/);
    expect(existsSync(resolve(repoRoot, 'packages/editor'))).toBe(false);
    expect(valueObjectsIndex).not.toContain('FontSize');
    expect(valueObjectsIndex).not.toContain('SettingCategory');
  });
});
