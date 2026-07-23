import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 819: GoalClientDTO / GoalFolderClientDTO dual bodies retired.
 * Sole *ClientDTOSchema + z.infer (no ZodType<Interface> dual annotation).
 */
describe('goal aggregate client dto duals retired (residual 819)', () => {
  const apiDir = __dirname;
  const responseSchemas = readFileSync(resolve(apiDir, 'response-schemas.ts'), 'utf8');
  const goal = readFileSync(resolve(apiDir, '../aggregates/goal-client.ts'), 'utf8');
  const folder = readFileSync(resolve(apiDir, '../aggregates/goal-folder-client.ts'), 'utf8');

  it('owns GoalClientDTO as z.infer of GoalClientDTOSchema', () => {
    expect(goal).toContain('Residual 819');
    expect(goal).toContain("from '../api/response-schemas'");
    expect(goal).toContain(
      'export type GoalClientDTO = z.infer<typeof GoalClientDTOSchema>',
    );
    expect(goal).not.toMatch(/export interface GoalClientDTO\b/);
    expect(responseSchemas).toContain('Residual 819');
    expect(responseSchemas).toContain(
      'export const GoalClientDTOSchema = z.object({',
    );
    expect(responseSchemas).not.toMatch(
      /export const GoalClientDTOSchema:\s*z\.ZodType<GoalClientDTO>/,
    );
  });

  it('owns GoalFolderClientDTO as z.infer of GoalFolderClientDTOSchema', () => {
    expect(folder).toContain('Residual 819');
    expect(folder).toContain("from '../api/response-schemas'");
    expect(folder).toContain(
      'export type GoalFolderClientDTO = z.infer<typeof GoalFolderClientDTOSchema>',
    );
    expect(folder).not.toMatch(/export interface GoalFolderClientDTO\b/);
    expect(responseSchemas).toContain(
      'export const GoalFolderClientDTOSchema = z.object({',
    );
    expect(responseSchemas).not.toMatch(
      /export const GoalFolderClientDTOSchema:\s*z\.ZodType<GoalFolderClientDTO>/,
    );
    expect(responseSchemas).toContain('displayName: z.string()');
    expect(responseSchemas).toContain('activeGoalCount: z.number()');
  });

  it('list envelopes nest Goal/GoalFolder ClientDTOSchema arrays', () => {
    expect(responseSchemas).toContain('data: z.array(GoalClientDTOSchema)');
    expect(responseSchemas).toContain('goal: GoalClientDTOSchema');
    expect(responseSchemas).toContain('keyResults: z.array(KeyResultClientDTOSchema).nullable()');
    expect(responseSchemas).toContain('reviews: z.array(GoalReviewClientDTOSchema).nullable()');
  });
});
