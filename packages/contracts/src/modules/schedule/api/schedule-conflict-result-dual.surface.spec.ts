import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 725: schedule conflict detection result dual bodies retired.
 * ConflictDetectionResult / ConflictDetail / ConflictSuggestion reuse *Schema only.
 */
describe('schedule conflict result dual retired (residual 725)', () => {
  const apiDir = __dirname;
  const vo = readFileSync(
    resolve(apiDir, '../value-objects/conflict-detection-result.ts'),
    'utf8',
  );
  const responseSchemas = readFileSync(resolve(apiDir, 'response-schemas.ts'), 'utf8');
  const routes = readFileSync(
    resolve(apiDir, '../../../../../schedule/src/api/schedule-event.routes.ts'),
    'utf8',
  );
  const residual679 = readFileSync(
    resolve(apiDir, 'schedule-dto-dual.surface.spec.ts'),
    'utf8',
  );

  it('exports conflict schemas as sole shapes from value-object module', () => {
    expect(vo).toContain('Residual 725');
    expect(vo).toContain('export const ConflictDetailSchema = z.object({');
    expect(vo).toContain('export const ConflictSuggestionSchema = z.object({');
    expect(vo).toContain('export const ConflictDetectionResultSchema = z.object({');
  });

  it('semantic types are z.infer aliases without interface dual bodies', () => {
    expect(vo).toContain(
      'export type ConflictDetail = z.infer<typeof ConflictDetailSchema>',
    );
    expect(vo).toContain(
      'export type ConflictSuggestion = z.infer<typeof ConflictSuggestionSchema>',
    );
    expect(vo).toContain(
      'export type ConflictDetectionResult = z.infer<typeof ConflictDetectionResultSchema>',
    );
    expect(vo).not.toMatch(/export interface ConflictDetail\b/);
    expect(vo).not.toMatch(/export interface ConflictSuggestion\b/);
    expect(vo).not.toMatch(/export interface ConflictDetectionResult\b/);
  });

  it('response-schemas re-exports VO schemas; routes use ConflictDetectionResultSchema', () => {
    expect(responseSchemas).toContain('Residual 725');
    expect(responseSchemas).toContain(
      "from '../value-objects/conflict-detection-result'",
    );
    expect(responseSchemas).not.toMatch(
      /const ConflictDetailSchema = z\.object\(\{/,
    );
    expect(responseSchemas).not.toMatch(
      /export const ConflictDetectionResultSchema = z\.object\(\{/,
    );
    expect(routes).toContain('ConflictDetectionResultSchema');
    // residual 679 name dual stay locked
    expect(residual679).toContain('Residual 679');
    expect(residual679).toContain('ConflictDetectionResultSchema');
  });
});
