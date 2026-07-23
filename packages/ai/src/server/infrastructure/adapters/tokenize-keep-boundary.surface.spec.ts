import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tokenize as indexTokenize } from './knowledge-index-value-helpers';

/**
 * Residual 1153: tokenize keep-boundary (knowledge-index vs knowledge-projection search).
 * - AI knowledge-index tokenize: ASCII alnum + underscore only ([a-z0-9_]+)
 * - API repository-knowledge-source tokenize: includes CJK \\u4e00-\\u9fff for projection search
 * Soft residual 969: PowerSync/Prisma duals retired onto knowledge-index sole.
 * Soft residual 1149: toKnowledgeNoteRef Desktop/API keep-boundary remains separate.
 * Does not flip §13.2 checkboxes.
 */
describe('tokenize keep-boundary (residual 1153)', () => {
  const dir = __dirname;
  const indexHelpers = readFileSync(resolve(dir, 'knowledge-index-value-helpers.ts'), 'utf8');
  const apiAdapter = readFileSync(
    resolve(dir, '../../../../../../apps/api/src/modules/ai/repository-knowledge-source.adapter.ts'),
    'utf8',
  );

  it('owns Residual 1153 keep-boundary markers on knowledge-index ASCII tokenize', () => {
    expect(indexHelpers).toContain('Residual 1153 keep-boundary');
    expect(indexHelpers).toMatch(/export function tokenize\b/);
    expect(indexHelpers).toContain('/[a-z0-9_]+/g');
    const body = indexHelpers.match(/export function tokenize\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).toContain('[a-z0-9_]');
    expect(body).not.toContain('\\u4e00');
    expect(body).not.toContain('u4e00');
  });

  it('differs from API projection-search CJK tokenize (no force-merge)', () => {
    expect(apiAdapter).toContain('Residual 1153 keep-boundary');
    expect(apiAdapter).toMatch(/function tokenize\b/);
    expect(apiAdapter).toContain('\\u4e00-\\u9fff');
    expect(apiAdapter).toContain('Soft residual 1153');
    const body = apiAdapter.match(/function tokenize\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).toContain('\\u4e00');
    // API must not use ASCII-only pattern as sole body
    expect(body).not.toContain('/[a-z0-9_]+/g');
  });

  it('runtime: knowledge-index tokenize drops CJK tokens (ASCII-only pattern)', () => {
    expect(indexTokenize('Hello_World x')).toEqual(['hello_world']);
    expect(indexTokenize('笔记 note')).toEqual(['note']);
    expect(indexTokenize('中文')).toEqual([]);
    expect(indexTokenize('a')).toEqual([]);
  });

  it('documents residual 1153 lock intent without claiming §13.2 complete', () => {
    const self = readFileSync(resolve(dir, 'tokenize-keep-boundary.surface.spec.ts'), 'utf8');
    expect(self).toContain('Residual 1153');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('keep-boundary');
  });
});
