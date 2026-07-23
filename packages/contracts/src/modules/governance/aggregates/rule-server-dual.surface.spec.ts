import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 651: rule server dual retired.
 * Governance API + domain toClientDTO use RuleClientDTO only.
 *
 * Soft residual 821: RuleClientDTO dual retired via RuleClientDTOSchema
 * (see rule-client-dto-dual surface; assertion updated below).
 */
describe('governance rule server dual single-track surface (residual 651)', () => {
  const aggregates = __dirname;

  it('drops rule-server dual file and export', () => {
    const index = readFileSync(resolve(aggregates, 'index.ts'), 'utf8');
    const client = readFileSync(resolve(aggregates, 'rule-client.ts'), 'utf8');
    expect(existsSync(resolve(aggregates, 'rule-server.ts'))).toBe(false);
    expect(index).not.toMatch(/export type \{[^}]*RuleServerDTO/);
    expect(index).not.toMatch(/from '\.\/rule-server'/);
    expect(index).toContain('RuleClientDTO');
    expect(client).toContain(
      'export type RuleClientDTO = z.infer<typeof RuleClientDTOSchema>',
    );
    expect(client).not.toMatch(/export interface RuleClientDTO\b/);
  });

  it('seed liveReference points at rule-client not rule-server', () => {
    const seed = readFileSync(
      resolve(
        aggregates,
        '../../../../../governance/src/server/infrastructure/seed/seed-data.ts',
      ),
      'utf8',
    );
    expect(seed).toContain(
      "liveReferenceLocation: 'packages/contracts/src/modules/governance/aggregates/rule-client.ts'",
    );
    expect(seed).not.toContain(
      "liveReferenceLocation: 'packages/contracts/src/modules/governance/aggregates/rule-server.ts'",
    );
  });
});
