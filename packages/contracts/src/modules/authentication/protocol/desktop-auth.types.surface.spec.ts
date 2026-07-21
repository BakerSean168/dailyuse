import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { SessionRestoreResult } from './desktop-auth.types';

/**
 * Desktop auth protocol surface (stage-6 residual 70):
 * SessionRestoreResult uses ok only — no success dual-track field.
 */
describe('desktop-auth SessionRestoreResult surface', () => {
  const source = readFileSync(resolve(__dirname, 'desktop-auth.types.ts'), 'utf8');

  it('keeps SessionRestoreResult on ok without success dual-track', () => {
    expect(source).toMatch(/export interface SessionRestoreResult \{[\s\S]*?\bok:\s*boolean;/);
    expect(source).not.toMatch(/export interface SessionRestoreResult \{[\s\S]*?\bsuccess\?:/);
  });

  it('types SessionRestoreResult with required ok', () => {
    const sample: SessionRestoreResult = {
      ok: true,
      hasValidSession: false,
    };
    expect(sample.ok).toBe(true);
    expect(sample).not.toHaveProperty('success');
  });
});
