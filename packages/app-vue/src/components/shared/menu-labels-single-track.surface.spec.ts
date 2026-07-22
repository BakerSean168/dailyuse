import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 227: menu labels are vue-i18n only.
 * No dual-track setMenuLocale/getMenuLocale/currentLocale shim.
 */
describe('menu labels single-track surface', () => {
  const dir = __dirname;
  const menuLabels = readFileSync(resolve(dir, 'menu-labels.ts'), 'utf8');
  const sharedIndex = readFileSync(resolve(dir, 'index.ts'), 'utf8');
  const localeSync = readFileSync(
    resolve(dir, '../../modules/setting/composables/useLocaleSync.ts'),
    'utf8',
  );

  it('exports only menuLabel (no set/getMenuLocale dual-track)', () => {
    expect(menuLabels).toContain('export function menuLabel');
    expect(menuLabels).not.toContain('export function setMenuLocale');
    expect(menuLabels).not.toContain('export function getMenuLocale');
    expect(menuLabels).not.toContain('currentLocale');
    expect(menuLabels).not.toContain('backward compatibility');
    expect(sharedIndex).toContain("export { menuLabel } from './menu-labels'");
    expect(sharedIndex).not.toContain('setMenuLocale');
    expect(sharedIndex).not.toContain('getMenuLocale');
  });

  it('useLocaleSync updates vue-i18n + document.lang only', () => {
    expect(localeSync).toContain('setI18nLocale');
    expect(localeSync).toContain('document.documentElement.lang');
    expect(localeSync).not.toContain('setMenuLocale');
    expect(localeSync).not.toContain('backward compat');
  });
});
