import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const workspaceRoot = resolve(import.meta.dirname, '../../../..');

function readWorkspaceFile(path: string): string {
  return readFileSync(resolve(workspaceRoot, path), 'utf8');
}

function expectKnowledgeIndexOrder(source: string): void {
  const schemaIndex = Math.max(source.indexOf('prisma migrate'), source.indexOf('prisma db push'));
  const bootstrapIndex = source.indexOf('bootstrap-ai-knowledge-index.ts');
  const smokeIndex = source.indexOf('verify-ai-knowledge-index.ts');

  expect(schemaIndex).toBeGreaterThanOrEqual(0);
  expect(bootstrapIndex).toBeGreaterThan(schemaIndex);
  expect(smokeIndex).toBeGreaterThan(bootstrapIndex);
  expect(source.slice(smokeIndex, smokeIndex + 160)).toContain('--require-pgvector');
}

describe('API production database startup chain', () => {
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
