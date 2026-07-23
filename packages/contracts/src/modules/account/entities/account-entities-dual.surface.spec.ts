import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 655: retire dual re-export barrels that re-exported aggregate DTOs
 * under entities/ — canonical export is aggregates/* only.
 *
 * Soft residual 825: AccountClientDTO dual retired via AccountResponseSchema
 * (see account-client-dto-dual surface).
 */
describe('account/goal entities dual re-export single-track surface (residual 655)', () => {
  const accountEntities = __dirname;
  const goalEntities = resolve(accountEntities, '../../goal/entities');
  const accountAggregates = resolve(accountEntities, '../aggregates');
  const goalAggregates = resolve(accountEntities, '../../goal/aggregates');

  it('account entities no longer dual-exports Account Client/Server DTOs', () => {
    const entities = readFileSync(resolve(accountEntities, 'index.ts'), 'utf8');
    const aggregates = readFileSync(resolve(accountAggregates, 'index.ts'), 'utf8');
    expect(entities).toMatch(/Residual 655/);
    expect(entities).not.toMatch(/export type \{[\s\S]*AccountClientDTO/);
    expect(entities).not.toMatch(/export type \{[\s\S]*AccountServerDTO/);
    expect(entities).not.toMatch(/from '\.\.\/aggregates\//);
    expect(aggregates).toContain('AccountClientDTO');
    expect(aggregates).toContain('AccountServerDTO');
  });

  it('goal entities no longer dual-exports record client DTO from aggregates', () => {
    const entities = readFileSync(resolve(goalEntities, 'index.ts'), 'utf8');
    const aggregates = readFileSync(resolve(goalAggregates, 'index.ts'), 'utf8');
    expect(entities).toMatch(/Residual 655/);
    expect(entities).not.toMatch(/from '\.\.\/aggregates\/goal-record-client'/);
    expect(entities).not.toMatch(/export type \{[\s\S]*GoalRecordClientDTO/);
    expect(entities).toContain('GoalRecordServerDTO');
    expect(aggregates).toContain('GoalRecordClientDTO');
  });
});
