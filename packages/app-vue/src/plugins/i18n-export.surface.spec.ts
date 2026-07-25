import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 246: app-vue i18n plugin does not convenience re-export useI18n.
 * Callers import useI18n from vue-i18n directly.
 */
describe('app-vue i18n export single-track surface', () => {
  const source = readFileSync(resolve(__dirname, 'i18n.ts'), 'utf8');

  it('does not re-export useI18n for convenience', () => {
    expect(source).toContain("from 'vue-i18n'");
    expect(source).toContain('export function createI18nPlugin');
    expect(source).not.toContain('Re-export useI18n for convenience');
    expect(source).not.toContain("export { useI18n } from 'vue-i18n'");
  });
});
