import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 689: goal list response dual bodies retired.
 * GetKeyResultsRes / GetGoalRecordsRes / GetGoalReviewsRes reuse *ListResSchema only (ClientDTO items).
 
 * Soft residual 815: GoalRecordClientDTO dual retired via GoalRecordClientDTOSchema
 * (see goal-record-client-dto-dual surface).
 * Soft residual 817: KeyResultClientDTO / GoalReviewClientDTO duals retired
 * (see goal-entity-client-dto-dual surface).*/
describe('goal list response dual retired (residual 689)', () => {
  const apiDir = __dirname;
  const responseSchemas = readFileSync(resolve(apiDir, 'response-schemas.ts'), 'utf8');
  const keyResult = readFileSync(resolve(apiDir, 'key-result.dto.ts'), 'utf8');
  const record = readFileSync(resolve(apiDir, 'goal-record.dto.ts'), 'utf8');
  const review = readFileSync(resolve(apiDir, 'goal-review.dto.ts'), 'utf8');

  it('exports list Res schemas with ClientDTO item arrays', () => {
    expect(responseSchemas).toContain('Residual 689');
    expect(responseSchemas).toContain('export const KeyResultListResSchema');
    expect(responseSchemas).toContain('export const GoalRecordListResSchema');
    expect(responseSchemas).toContain('export const GoalReviewListResSchema');
    expect(responseSchemas).toContain('data: z.array(KeyResultClientDTOSchema)');
    expect(responseSchemas).toContain('data: z.array(GoalRecordClientDTOSchema)');
    expect(responseSchemas).toContain('data: z.array(GoalReviewClientDTOSchema)');
  });

  it('semantic list Res types are z.infer aliases without interface dual bodies', () => {
    expect(keyResult).toContain('Residual 689');
    expect(keyResult).toContain(
      'export type GetKeyResultsRes = z.infer<typeof KeyResultListResSchema>',
    );
    expect(keyResult).not.toMatch(/export interface GetKeyResultsRes\b/);

    expect(record).toContain('Residual 689');
    expect(record).toContain(
      'export type GetGoalRecordsRes = z.infer<typeof GoalRecordListResSchema>',
    );
    expect(record).not.toMatch(/export interface GetGoalRecordsRes\b/);

    expect(review).toContain('Residual 689');
    expect(review).toContain(
      'export type GetGoalReviewsRes = z.infer<typeof GoalReviewListResSchema>',
    );
    expect(review).not.toMatch(/export interface GetGoalReviewsRes\b/);
    expect(review).not.toMatch(/GoalReviewServerDTO/);
  });
});
