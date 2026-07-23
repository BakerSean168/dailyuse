import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { toPrismaJson } from './to-prisma-json';

/**
 * Residual 979: toPrismaJson dual retired (AI Prisma adapters).
 * Sole body in to-prisma-json.ts; agent-checkpoint + knowledge-index Prisma adapters import it.
 * Soft residual 1014: tip focused suite numbers track Residual 1014 evidence tip (297/1291).
 * Soft residual 981: toIso dual retired (authentication powersync mappers/to-iso-dual.surface.spec.ts).
 * Soft residual: account package toPrismaJson DTO cast remains keep-boundary.
 * Does not flip §13.2 checkboxes.
 */
describe('toPrismaJson dual retired (residual 979)', () => {
  const prismaDir = __dirname;
  const sole = readFileSync(resolve(prismaDir, 'to-prisma-json.ts'), 'utf8');
  const checkpoint = readFileSync(
    resolve(prismaDir, 'agent-checkpoint-prisma.adapter.ts'),
    'utf8',
  );
  const knowledge = readFileSync(
    resolve(prismaDir, 'ai-knowledge-index-prisma.repository.ts'),
    'utf8',
  );
  const account = readFileSync(
    resolve(
      prismaDir,
      '../../../../../../account/src/server/infrastructure/adapters/prisma/account-prisma.repository.ts',
    ),
    'utf8',
  );

  it('owns sole toPrismaJson helper body', () => {
    expect(sole).toContain('Residual 979');
    expect(sole).toMatch(/export function toPrismaJson\b/);
    expect(sole).toContain('JSON.parse(JSON.stringify(value))');
    expect(sole).toContain('Prisma.InputJsonValue');
  });

  it('agent-checkpoint + knowledge-index import sole without local dual bodies', () => {
    for (const [label, source] of [
      ['checkpoint', checkpoint],
      ['knowledge', knowledge],
    ] as const) {
      expect(source, label).toContain('Residual 979');
      expect(source, label).toContain("import { toPrismaJson } from './to-prisma-json'");
      expect(source, label).not.toMatch(/function toPrismaJson\b/);
      expect(source, label).toContain('toPrismaJson(');
    }
  });

  it('keeps account toPrismaJson as distinct keep-boundary', () => {
    expect(account).toMatch(/function toPrismaJson\b/);
    expect(account).toContain('Prisma.InputJsonObject');
    expect(account).not.toContain("from './to-prisma-json'");
    expect(account).not.toContain('JSON.parse(JSON.stringify(value))');
  });

  it('deep-clones plain objects into JSON-safe values', () => {
    const input = { a: 1, b: ['x', 2], c: { d: true } };
    const out = toPrismaJson(input);
    expect(out).toEqual(input);
    expect(out).not.toBe(input);
  });
});
