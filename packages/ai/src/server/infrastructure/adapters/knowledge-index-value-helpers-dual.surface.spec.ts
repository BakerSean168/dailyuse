import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  toChunkArray,
  toNumberArray,
  toStringArray,
  tokenize,
} from './knowledge-index-value-helpers';

/**
 * Residual 969: knowledge-index value helper duals retired.
 * Sole body in knowledge-index-value-helpers.ts; PowerSync + Prisma repositories import it.
 * Soft residual 967: isAbortLikeError dual retired (shared/is-abort-like-error-dual.surface.spec.ts).
 * Soft residual 970: tip focused suite numbers track Residual 970 evidence tip (276/1216).
 * Does not flip §13.2 checkboxes.
 */
describe('knowledge-index value helpers dual retired (residual 969)', () => {
  const adaptersDir = __dirname;
  const sole = readFileSync(resolve(adaptersDir, 'knowledge-index-value-helpers.ts'), 'utf8');
  const powersync = readFileSync(
    resolve(adaptersDir, 'powersync/ai-knowledge-index-powersync.repository.ts'),
    'utf8',
  );
  const prisma = readFileSync(
    resolve(adaptersDir, 'prisma/ai-knowledge-index-prisma.repository.ts'),
    'utf8',
  );

  it('owns sole knowledge-index value helper bodies', () => {
    expect(sole).toContain('Residual 969');
    expect(sole).toMatch(/export function toStringArray\b/);
    expect(sole).toMatch(/export function toNumberArray\b/);
    expect(sole).toMatch(/export function tokenize\b/);
    expect(sole).toMatch(/export function toChunkArray\b/);
    expect(sole).toContain('KnowledgeIndexedChunk');
  });

  it('PowerSync + Prisma repositories import sole without local dual bodies', () => {
    for (const [label, source] of [
      ['powersync', powersync],
      ['prisma', prisma],
    ] as const) {
      expect(source, label).toContain('Residual 969');
      expect(source, label).toContain(
        "from '../knowledge-index-value-helpers'",
      );
      expect(source, label).not.toMatch(/function toStringArray\b/);
      expect(source, label).not.toMatch(/function toNumberArray\b/);
      expect(source, label).not.toMatch(/function tokenize\b/);
      expect(source, label).not.toMatch(/function toChunkArray\b/);
      expect(source, label).toContain('toStringArray(');
      expect(source, label).toContain('toNumberArray(');
      expect(source, label).toContain('tokenize(');
      expect(source, label).toContain('toChunkArray(');
    }
  });

  it('coerces arrays/tokens/chunks for knowledge index storage shapes', () => {
    expect(toStringArray(['a', 1, 'b'])).toEqual(['a', 'b']);
    expect(toNumberArray([1, 'x', 2])).toEqual([1, 2]);
    expect(tokenize('Hello_World x')).toEqual(['hello_world']);
    expect(
      toChunkArray([
        {
          chunkIndex: 1,
          content: 'body',
          contentHash: 'h',
          startOffset: 0,
          endOffset: 4,
          headingPath: ['A'],
          keywords: ['k'],
          embedding: [0.1],
        },
        { content: '' },
      ]),
    ).toEqual([
      {
        chunkIndex: 1,
        content: 'body',
        contentHash: 'h',
        startOffset: 0,
        endOffset: 4,
        headingPath: ['A'],
        keywords: ['k'],
        embedding: [0.1],
      },
    ]);
  });
});
