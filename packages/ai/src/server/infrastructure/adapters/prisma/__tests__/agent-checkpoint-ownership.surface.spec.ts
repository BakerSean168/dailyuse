import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Agent checkpoint ownership surface (stage-6 residual 105/107):
 * upsert must not overwrite foreign-owned runId; get/list must not leak
 * spoofed run.identityId metadata.
 */
describe('agent checkpoint ownership surface', () => {
  const adapter = readFileSync(
    resolve(__dirname, '../agent-checkpoint-prisma.adapter.ts'),
    'utf8',
  );

  it('upsert rejects run.identityId spoofing and foreign runId ownership', () => {
    const upsertStart = adapter.indexOf('async upsert(');
    expect(upsertStart).toBeGreaterThan(-1);
    const block = adapter.slice(upsertStart, upsertStart + 2200);
    expect(block).toContain('run.identityId !== identityId');
    expect(block).toContain("code: 'FORBIDDEN'");
    expect(block).toContain('existing.identityId !== identityId');
    expect(block).toContain('findUnique');
    expect(block).not.toMatch(/agentRunCheckpoint\.upsert\(\{\s*where:\s*\{\s*runId/);
  });

  it('get/delete still scope by identityId', () => {
    expect(adapter).toContain('async get(');
    expect(adapter).toContain('async delete(');
    expect(adapter).toMatch(/async get\([\s\S]*?where:\s*\{[\s\S]*?identityId/);
    expect(adapter).toMatch(/async delete\([\s\S]*?where:\s*\{[\s\S]*?identityId/);
  });

  it('get/list defense-in-depth checks run.identityId against request identity', () => {
    expect(adapter).toContain('run.identityId !== identityId');
    expect(adapter).toContain('.filter((run) => run.identityId === identityId)');
  });
});
