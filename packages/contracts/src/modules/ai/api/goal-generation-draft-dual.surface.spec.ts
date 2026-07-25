import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 719: goal generation draft/preview/result dual bodies retired.
 * GeneratedGoalDraft / KeyResultPreview / GenerateGoalResultDTO /
 * GenerateKeyResultsResultDTO reuse *Schema only (schemas owned by dto module).
 */
describe('goal generation draft dual retired (residual 719)', () => {
  const apiDir = __dirname;
  const dto = readFileSync(
    resolve(apiDir, '../dtos/goal-generation-result.dto.ts'),
    'utf8',
  );
  const automation = readFileSync(resolve(apiDir, 'ai-goal-automation.dto.ts'), 'utf8');
  const responseSchemas = readFileSync(resolve(apiDir, 'response-schemas.ts'), 'utf8');

  it('exports draft/preview/result schemas as sole shapes from dto module', () => {
    expect(dto).toContain('Residual 719');
    expect(dto).toContain('export const GeneratedGoalDraftSchema = z.object({');
    expect(dto).toContain('export const KeyResultPreviewSchema = z.object({');
    expect(dto).toContain('export const GenerateGoalResultDTOSchema = z.object({');
    expect(dto).toContain('export const GenerateKeyResultsResultDTOSchema = z.object({');
  });

  it('semantic types are z.infer aliases without interface dual bodies', () => {
    expect(dto).toContain(
      'export type GeneratedGoalDraft = z.infer<typeof GeneratedGoalDraftSchema>',
    );
    expect(dto).toContain(
      'export type KeyResultPreview = z.infer<typeof KeyResultPreviewSchema>',
    );
    expect(dto).toContain(
      'export type GenerateGoalResultDTO = z.infer<typeof GenerateGoalResultDTOSchema>',
    );
    expect(dto).toContain(
      'export type GenerateKeyResultsResultDTO = z.infer<typeof GenerateKeyResultsResultDTOSchema>',
    );
    expect(dto).not.toMatch(/export interface GeneratedGoalDraft\b/);
    expect(dto).not.toMatch(/export interface KeyResultPreview\b/);
    expect(dto).not.toMatch(/export interface GenerateGoalResultDTO\b/);
    expect(dto).not.toMatch(/export interface GenerateKeyResultsResultDTO\b/);
  });

  it('automation and response-schemas reuse dto-owned draft schemas (no local dual bodies)', () => {
    expect(automation).toContain('Residual 719');
    expect(automation).toContain('GeneratedGoalDraftSchema');
    expect(automation).toContain('KeyResultPreviewSchema');
    expect(automation).not.toMatch(
      /export const GeneratedGoalDraftSchema = z\.object\(\{/,
    );
    expect(automation).not.toMatch(
      /export const KeyResultPreviewSchema = z\.object\(\{/,
    );
    expect(responseSchemas).toContain('Residual 719');
    expect(responseSchemas).toContain(
      "from '../dtos/goal-generation-result.dto'",
    );
    expect(responseSchemas).not.toMatch(
      /const GeneratedGoalDraftSchema = z\.object\(\{/,
    );
    expect(responseSchemas).not.toMatch(
      /const KeyResultPreviewSchema = z\.object\(\{/,
    );
    expect(responseSchemas).not.toMatch(
      /export const GenerateGoalResultDTOSchema = z\.object\(\{/,
    );
  });
});
