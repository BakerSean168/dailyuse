import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 815: GoalRecordClientDTO dual body retired.
 * Sole GoalRecordClientDTOSchema + z.infer.
 */
describe('goal record client dto dual retired (residual 815)', () => {
  const apiDir = __dirname;
  const responseSchemas = readFileSync(resolve(apiDir, 'response-schemas.ts'), 'utf8');
  const aggregate = readFileSync(
    resolve(apiDir, '../aggregates/goal-record-client.ts'),
    'utf8',
  );
  const routes = readFileSync(
    resolve(apiDir, '../../../../../goal/src/api/routes/goal-record.routes.ts'),
    'utf8',
  );

  it('owns GoalRecordClientDTO as z.infer of GoalRecordClientDTOSchema', () => {
    expect(aggregate).toContain('Residual 815');
    expect(aggregate).toContain("from '../api/response-schemas'");
    expect(aggregate).toContain(
      'export type GoalRecordClientDTO = z.infer<typeof GoalRecordClientDTOSchema>',
    );
    expect(aggregate).not.toMatch(/export interface GoalRecordClientDTO\b/);
  });

  it('GoalRecordClientDTOSchema owns value/valueAfter/comment fields', () => {
    expect(responseSchemas).toContain('Residual 815');
    expect(responseSchemas).toContain(
      'export const GoalRecordClientDTOSchema = z.object({',
    );
    expect(responseSchemas).toContain('value: z.number()');
    expect(responseSchemas).toContain('valueAfter: z.number()');
    expect(responseSchemas).toContain('comment: z.string().nullable()');
    expect(responseSchemas).toContain('keyResultId: brandedId<KeyResultId>()');
    expect(responseSchemas).toContain('goalId: brandedId<GoalId>()');
  });

  it('OpenAPI goal-record routes and list envelopes use GoalRecordClientDTOSchema', () => {
    expect(routes).toContain('GoalRecordClientDTOSchema');
    expect(responseSchemas).toContain('data: z.array(GoalRecordClientDTOSchema)');
    expect(responseSchemas).toContain('records: z.array(GoalRecordClientDTOSchema).optional()');
  });
});
