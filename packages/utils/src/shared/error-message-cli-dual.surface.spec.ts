import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { errorMessage } from './error-message';

/**
 * Residual 1019: database CLI toErrorMessage dual retired onto residual 999 sole.
 * Sole body in @dailyuse/utils/shared/error-message; scripts alias import as toErrorMessage.
 * Soft residual 1020: tip focused suite numbers track Residual 1020 evidence tip (300/1303).
 * Soft residual 999: AI runtime + local vault already on sole.
 * Does not flip §13.2 checkboxes.
 */
describe('database CLI toErrorMessage dual retired (residual 1019)', () => {
  const sharedDir = __dirname;
  const sole = readFileSync(resolve(sharedDir, 'error-message.ts'), 'utf8');
  const index = readFileSync(resolve(sharedDir, 'index.ts'), 'utf8');
  const scripts = {
    preparePgvector: readFileSync(
      resolve(sharedDir, '../../../database/scripts/prepare-ai-knowledge-index-pgvector.ts'),
      'utf8',
    ),
    bootstrap: readFileSync(
      resolve(sharedDir, '../../../database/scripts/bootstrap-ai-knowledge-index.ts'),
      'utf8',
    ),
    verify: readFileSync(
      resolve(sharedDir, '../../../database/scripts/verify-ai-knowledge-index.ts'),
      'utf8',
    ),
    prepareEditor: readFileSync(
      resolve(sharedDir, '../../../database/scripts/prepare-editor-workspace-natural-key.ts'),
      'utf8',
    ),
  } as const;

  it('owns residual 999 sole errorMessage body and shared barrel export', () => {
    expect(sole).toContain('Residual 999');
    expect(sole).toMatch(/export function errorMessage\b/);
    expect(sole).toContain('error instanceof Error');
    expect(sole).toContain('String(error)');
    expect(index).toContain("export * from './error-message'");
  });

  it('four database CLI scripts import sole without local dual bodies', () => {
    for (const [label, source] of Object.entries(scripts)) {
      expect(source, label).toContain('Residual 1019');
      expect(source, label).toContain(
        "import { errorMessage as toErrorMessage } from '@dailyuse/utils/shared'",
      );
      expect(source, label).not.toMatch(/function toErrorMessage\b/);
      expect(source, label).not.toMatch(/function errorMessage\b/);
      expect(source, label).toContain('toErrorMessage(');
    }
  });

  it('scripts keep load-workspace-env local bootstrap without reintroducing dual helper bodies', () => {
    for (const [label, source] of Object.entries(scripts)) {
      expect(source, label).toContain("from '../src/load-workspace-env'");
      expect(source, label).not.toContain('error instanceof Error ? error.message');
    }
  });

  it('coerces Error and non-Error values (sole behavior used by CLI alias)', () => {
    expect(errorMessage(new Error('boom'))).toBe('boom');
    expect(errorMessage('plain')).toBe('plain');
    expect(errorMessage(42)).toBe('42');
    expect(errorMessage(null)).toBe('null');
    expect(errorMessage(undefined)).toBe('undefined');
  });
});
