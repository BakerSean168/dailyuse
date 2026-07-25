import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 817: KeyResultClientDTO / GoalReviewClientDTO dual bodies retired.
 * Sole *ClientDTOSchema + z.infer (no ZodType<Interface> dual annotation).
 */
describe('goal entity client dto duals retired (residual 817)', () => {
  const apiDir = __dirname;
  const responseSchemas = readFileSync(resolve(apiDir, 'response-schemas.ts'), 'utf8');
  const keyResult = readFileSync(resolve(apiDir, '../entities/key-result-client.ts'), 'utf8');
  const review = readFileSync(resolve(apiDir, '../entities/goal-review-client.ts'), 'utf8');

  it('owns KeyResultClientDTO as z.infer of KeyResultClientDTOSchema', () => {
    expect(keyResult).toContain('Residual 817');
    expect(keyResult).toContain(
      'export type KeyResultClientDTO = z.infer<typeof KeyResultClientDTOSchema>',
    );
    expect(keyResult).not.toMatch(/export interface KeyResultClientDTO\b/);
    expect(responseSchemas).toContain('Residual 817');
    expect(responseSchemas).toContain(
      'export const KeyResultClientDTOSchema = z.object({',
    );
    expect(responseSchemas).not.toMatch(
      /export const KeyResultClientDTOSchema:\s*z\.ZodType<KeyResultClientDTO>/,
    );
  });

  it('owns GoalReviewClientDTO as z.infer of GoalReviewClientDTOSchema', () => {
    expect(review).toContain('Residual 817');
    expect(review).toContain(
      'export type GoalReviewClientDTO = z.infer<typeof GoalReviewClientDTOSchema>',
    );
    expect(review).not.toMatch(/export interface GoalReviewClientDTO\b/);
    expect(responseSchemas).toContain(
      'export const GoalReviewClientDTOSchema = z.object({',
    );
    expect(responseSchemas).not.toMatch(
      /export const GoalReviewClientDTOSchema:\s*z\.ZodType<GoalReviewClientDTO>/,
    );
    expect(responseSchemas).toContain('keyResultSnapshots: z.array(KeyResultSnapshotDTOSchema)');
  });

  it('list envelopes nest KeyResult/GoalReview ClientDTOSchema arrays', () => {
    expect(responseSchemas).toContain('data: z.array(KeyResultClientDTOSchema)');
    expect(responseSchemas).toContain('data: z.array(GoalReviewClientDTOSchema)');
  });
});
