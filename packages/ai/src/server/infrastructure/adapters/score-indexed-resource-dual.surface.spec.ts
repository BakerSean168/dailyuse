import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { scoreIndexedResource } from './knowledge-index-value-helpers';
import type { KnowledgeIndexedNote } from '../../application/ports';

/**
 * Residual 1195: scoreIndexedResource dual retired onto knowledge-index-value-helpers sole.
 * Prisma hybrid path passes semanticScore; PowerSync uses default 0 lexical scoring.
 * Soft residual 969: toStringArray/toNumberArray/tokenize/toChunkArray duals already retired.
 * Soft residual 1153: API repository-knowledge-source tokenize CJK keep-boundary remains separate.
 * Does not flip §13.2 checkboxes.
 */
describe('scoreIndexedResource dual retired (residual 1195)', () => {
  const dir = __dirname;
  const sole = readFileSync(resolve(dir, 'knowledge-index-value-helpers.ts'), 'utf8');
  const powersync = readFileSync(
    resolve(dir, 'powersync/ai-knowledge-index-powersync.repository.ts'),
    'utf8',
  );
  const prisma = readFileSync(
    resolve(dir, 'prisma/ai-knowledge-index-prisma.repository.ts'),
    'utf8',
  );

  const sample: KnowledgeIndexedNote = {
    identityId: 'i1',
    repositoryId: 'r1',
    resourceId: 'res1',
    resourcePath: 'docs/readme.md',
    title: 'Hello World',
    mimeType: 'text/markdown',
    contentHash: 'h',
    summary: 'Intro to scoring',
    keywords: ['hello', 'world'],
    embedding: [],
    chunks: [],
    metadata: {},
  };

  it('owns sole scoreIndexedResource helper body', () => {
    expect(sole).toContain('Residual 1195');
    expect(sole).toMatch(/export function scoreIndexedResource\b/);
    expect(sole).toContain('semanticScore = 0');
    expect(sole).toContain('semanticScore * 4');
    expect(sole).toContain('tokenize(trimmedQuery)');
  });

  it('retires PowerSync + Prisma local dual bodies onto sole import', () => {
    for (const [label, source] of [
      ['powersync', powersync],
      ['prisma', prisma],
    ] as const) {
      expect(source, label).toContain('Soft residual 1195');
      expect(source, label).toContain('scoreIndexedResource');
      expect(source, label).toContain("from '../knowledge-index-value-helpers'");
      expect(source, label).not.toMatch(/function scoreIndexedResource\b/);
    }
    expect(prisma).toContain('scoreIndexedResource(resource, query, Math.max');
    expect(powersync).toContain('scoreIndexedResource(resource, query)');
  });

  it('runtime: lexical scoring + optional semantic boost', () => {
    expect(scoreIndexedResource(sample, '')).toBe(1);
    expect(scoreIndexedResource(sample, '', 0.5)).toBe(0.5);
    const lexical = scoreIndexedResource(sample, 'hello docs');
    expect(lexical).toBeGreaterThan(0);
    const hybrid = scoreIndexedResource(sample, 'hello docs', 1);
    expect(hybrid).toBe(lexical + 4);
  });

  it('documents residual 1195 lock intent without claiming §13.2 complete', () => {
    const self = readFileSync(resolve(dir, 'score-indexed-resource-dual.surface.spec.ts'), 'utf8');
    expect(self).toContain('Residual 1195');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('dual retired');
  });
});
