import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { formatFileSize as utilsFormatFileSize } from './api-utils';

/**
 * Residual 1145: formatFileSize cross-package keep-boundary.
 * - utils frontend: zero → "0 Bytes"; ladder Bytes/KB/MB/GB/TB; toFixed(2)
 * - app-react file-utils: zero → "0 B"; ladder B/KB/MB/GB; toFixed(1)
 * Intentionally not force-merged — mobile display copy differs from utils web/api helpers.
 * Does not flip §13.2 checkboxes.
 */
describe('formatFileSize keep-boundary (residual 1145)', () => {
  const dir = __dirname;
  const utilsSrc = readFileSync(resolve(dir, 'api-utils.ts'), 'utf8');
  const appReactSrc = readFileSync(
    resolve(dir, '../../../app-react/src/utils/file-utils.ts'),
    'utf8',
  );

  it('owns Residual 1145 keep-boundary markers on utils formatFileSize', () => {
    expect(utilsSrc).toContain('Residual 1145 keep-boundary');
    expect(utilsSrc).toMatch(/export function formatFileSize\b/);
    expect(utilsSrc).toContain("return '0 Bytes'");
    expect(utilsSrc).toContain("['Bytes', 'KB', 'MB', 'GB', 'TB']");
    expect(utilsSrc).toContain('toFixed(2)');
    const body = utilsSrc.match(/export function formatFileSize\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).toContain('0 Bytes');
    expect(body).not.toContain("'0 B'");
    expect(body).not.toContain('toFixed(1)');
  });

  it('differs from app-react formatFileSize display shape (no force-merge)', () => {
    expect(appReactSrc).toContain('Soft residual 1145');
    expect(appReactSrc).toMatch(/export function formatFileSize\b/);
    expect(appReactSrc).toContain("return '0 B'");
    expect(appReactSrc).toContain("['B', 'KB', 'MB', 'GB']");
    expect(appReactSrc).toContain('toFixed(1)');
    const body = appReactSrc.match(/export function formatFileSize\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).not.toContain('0 Bytes');
    expect(body).not.toContain("'TB'");
    expect(body).not.toContain('toFixed(2)');
  });

  it('runtime: utils zero and scaling match Bytes ladder + two decimals', () => {
    expect(utilsFormatFileSize(0)).toBe('0 Bytes');
    expect(utilsFormatFileSize(1024)).toBe('1 KB');
    expect(utilsFormatFileSize(1536)).toBe('1.5 KB');
    expect(utilsFormatFileSize(1048576)).toBe('1 MB');
  });

  it('documents residual 1145 lock intent without claiming §13.2 complete', () => {
    const self = readFileSync(
      resolve(dir, 'format-file-size-keep-boundary.surface.spec.ts'),
      'utf8',
    );
    expect(self).toContain('Residual 1145');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('keep-boundary');
  });
});
