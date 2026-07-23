import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { previewText } from './preview-text';

/**
 * Residual 1011: previewText dual retired (AI package re-export + API automation).
 * Sole body in @dailyuse/utils/shared/preview-text (default maxLength 240).
 * Soft residual 1026: tip focused suite numbers track Residual 1026 evidence tip (303/1315).
 * Soft residual 1009: readNestedNumber dual retired (read-nested-number-dual.surface.spec.ts).
 * Soft residual 995: AI consumers keep package-local re-export path (preview-text.ts).
 * Does not flip §13.2 checkboxes.
 */
describe('previewText dual retired (residual 1011)', () => {
  const sharedDir = __dirname;
  const sole = readFileSync(resolve(sharedDir, 'preview-text.ts'), 'utf8');
  const index = readFileSync(resolve(sharedDir, 'index.ts'), 'utf8');
  const aiReexport = readFileSync(
    resolve(sharedDir, '../../../ai/src/shared/preview-text.ts'),
    'utf8',
  );
  const api = readFileSync(
    resolve(
      sharedDir,
      '../../../../apps/api/src/modules/ai/backend-automation-tool-executor.adapter.ts',
    ),
    'utf8',
  );

  it('owns sole previewText helper body and shared barrel export', () => {
    expect(sole).toContain('Residual 1011');
    expect(sole).toMatch(/export function previewText\b/);
    expect(sole).toContain("value.replace(/\\s+/g, ' ')");
    expect(sole).toContain('maxLength = 240');
    expect(sole).toContain('maxLength - 3');
    expect(sole).toContain('...');
    expect(index).toContain("export * from './preview-text'");
  });

  it('AI package re-exports utils sole without local dual body', () => {
    expect(aiReexport).toContain('Residual 995');
    expect(aiReexport).toContain('Residual 1011');
    expect(aiReexport).toContain("export { previewText } from '@dailyuse/utils/shared'");
    expect(aiReexport).not.toMatch(/export function previewText\b/);
    expect(aiReexport).not.toContain('maxLength = 240');
  });

  it('API automation imports sole without local dual body and keeps maxLength 200', () => {
    expect(api).toContain('Residual 1011');
    expect(api).toContain("from '@dailyuse/utils/shared'");
    expect(api).toMatch(/previewText/);
    expect(api).not.toMatch(/function previewText\b/);
    expect(api).toMatch(/previewText\([^)]+,\s*200\)/);
    expect(api).toContain('previewText(input.request.idea, 200)');
    expect(api).toContain('previewText(action.rationale, 200)');
  });

  it('collapses whitespace and truncates with ellipsis', () => {
    expect(previewText(undefined)).toBeUndefined();
    expect(previewText(null)).toBeUndefined();
    expect(previewText('')).toBeUndefined();
    expect(previewText('  hello   world  ')).toBe('hello world');
    expect(previewText('abcdefghij', 7)).toBe('abcd...');
    expect(previewText('short', 240)).toBe('short');
    // Default maxLength is 240 (utils sole); callers may pass 200.
    const long = 'x'.repeat(250);
    expect(previewText(long)?.length).toBe(240);
    expect(previewText(long)?.endsWith('...')).toBe(true);
    expect(previewText(long, 200)?.length).toBe(200);
  });
});
