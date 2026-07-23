import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  detectBrowserLocale,
  normalizeLocale,
  normalizeTheme,
} from './presentation-preference';

/**
 * Residual 1005: presentation preference duals retired
 * (detectBrowserLocale + normalizeLocale + normalizeTheme).
 * Sole bodies in @dailyuse/utils/shared/presentation-preference.
 * Soft residual 1024: tip focused suite numbers track Residual 1024 evidence tip (302/1311).
 * Does not flip §13.2 checkboxes.
 */
describe('presentation preference duals retired (residual 1005)', () => {
  const sharedDir = __dirname;
  const sole = readFileSync(resolve(sharedDir, 'presentation-preference.ts'), 'utf8');
  const index = readFileSync(resolve(sharedDir, 'index.ts'), 'utf8');
  const webPresentation = readFileSync(
    resolve(sharedDir, '../../../../apps/web/src/auth/presentation.ts'),
    'utf8',
  );
  const appVueStore = readFileSync(
    resolve(
      sharedDir,
      '../../../app-vue/src/modules/setting/stores/presentation-preference-store.ts',
    ),
    'utf8',
  );

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('owns sole presentation helpers and shared barrel export', () => {
    expect(sole).toContain('Residual 1005');
    expect(sole).toMatch(/export function detectBrowserLocale\b/);
    expect(sole).toMatch(/export function normalizeLocale\b/);
    expect(sole).toMatch(/export function normalizeTheme\b/);
    expect(sole).toContain("startsWith('zh')");
    expect(sole).toContain("'light' || value === 'dark' || value === 'auto'");
    expect(index).toContain("export * from './presentation-preference'");
  });

  it('web auth presentation + app-vue store import sole without local dual bodies', () => {
    for (const [label, source] of [
      ['web-presentation', webPresentation],
      ['app-vue-store', appVueStore],
    ] as const) {
      expect(source, label).toContain('Residual 1005');
      expect(source, label).toContain("from '@dailyuse/utils/shared'");
      expect(source, label).toContain('detectBrowserLocale');
      expect(source, label).toContain('normalizeLocale');
      expect(source, label).toContain('normalizeTheme');
      expect(source, label).not.toMatch(/function detectBrowserLocale\b/);
      expect(source, label).not.toMatch(/function normalizeLocale\b/);
      expect(source, label).not.toMatch(/function normalizeTheme\b/);
    }
  });

  it('detects zh locale, normalizes locale/theme, and defaults safely', () => {
    vi.stubGlobal('navigator', {
      languages: ['zh-CN', 'en-US'],
      language: 'zh-CN',
    });
    expect(detectBrowserLocale()).toBe('zh-CN');

    vi.stubGlobal('navigator', {
      languages: ['en-US'],
      language: 'en-US',
    });
    expect(detectBrowserLocale()).toBe('en-US');

    expect(normalizeLocale('zh-CN')).toBe('zh-CN');
    expect(normalizeLocale('en-US')).toBe('en-US');
    expect(normalizeLocale('fr-FR')).toBe('en-US');

    expect(normalizeTheme('light')).toBe('light');
    expect(normalizeTheme('dark')).toBe('dark');
    expect(normalizeTheme('auto')).toBe('auto');
    expect(normalizeTheme('nope')).toBe('auto');
    expect(normalizeTheme(undefined)).toBe('auto');
  });
});
