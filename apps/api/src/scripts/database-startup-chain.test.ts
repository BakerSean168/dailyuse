import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const workspaceRoot = resolve(import.meta.dirname, '../../../..');

function readWorkspaceFile(path: string): string {
  return readFileSync(resolve(workspaceRoot, path), 'utf8');
}

function expectKnowledgeIndexOrder(source: string): void {
  const pgvectorPrepareIndex = source.indexOf('prepare-ai-knowledge-index-pgvector.ts');
  const migrateIndex = Math.max(
    source.indexOf('prisma migrate'),
    source.indexOf("'migrate', 'deploy'"),
  );
  const schemaPushIndex = Math.max(
    source.indexOf('prisma db push'),
    source.indexOf("'db', 'push'"),
  );
  const schemaIndex = Math.max(migrateIndex, schemaPushIndex);
  const editorNaturalKeyIndex = source.indexOf('prepare-editor-workspace-natural-key.ts');
  const bootstrapIndex = source.indexOf('bootstrap-ai-knowledge-index.ts');
  const smokeIndex = source.indexOf('verify-ai-knowledge-index.ts');

  expect(schemaIndex).toBeGreaterThanOrEqual(0);
  expect(pgvectorPrepareIndex).toBeGreaterThanOrEqual(0);
  expect(pgvectorPrepareIndex).toBeLessThan(schemaIndex);
  expect(schemaPushIndex).toBeGreaterThanOrEqual(0);
  expect(editorNaturalKeyIndex).toBeGreaterThanOrEqual(0);
  expect(editorNaturalKeyIndex).toBeLessThan(schemaPushIndex);
  expect(bootstrapIndex).toBeGreaterThan(schemaIndex);
  expect(smokeIndex).toBeGreaterThan(bootstrapIndex);
  expect(source.slice(smokeIndex, smokeIndex + 160)).toContain('--require-pgvector');
}

describe('API production database startup chain', () => {
  it('declares the bootstrap-managed vector column in Prisma schema reconciliation', () => {
    const schema = readWorkspaceFile('packages/database/prisma/schema/ai.prisma');

    expect(schema).toContain(
      'retrievalVector Unsupported("vector(48)")? @map("retrieval_vector")',
    );
  });

  it('bootstraps and requires pgvector after schema initialization in the container entrypoint', () => {
    const script = readWorkspaceFile('apps/api/scripts/run-migrations.sh');

    expect(script).toMatch(/^set -e$/m);
    expectKnowledgeIndexOrder(script);
  });

  it('keeps the alternate production startup entrypoint on the same required sequence', () => {
    const script = readWorkspaceFile('apps/api/scripts/start-production.mjs');

    expectKnowledgeIndexOrder(script);
    expect(script.indexOf('Starting API process')).toBeGreaterThan(
      script.indexOf('verify-ai-knowledge-index.ts'),
    );
  });
});
