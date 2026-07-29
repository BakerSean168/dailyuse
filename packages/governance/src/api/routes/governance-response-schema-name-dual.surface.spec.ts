import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 681: governance OpenAPI response schema name duals retired.
 * Routes document contracts schemas directly (no local *ResponseSchema aliases).
 */
describe('governance response schema name dual retired (residual 681)', () => {
  const routesDir = __dirname;
  const shared = readFileSync(resolve(routesDir, 'governance-route-shared.ts'), 'utf8');
  const rules = readFileSync(resolve(routesDir, 'governance-rules.routes.ts'), 'utf8');
  const revisions = readFileSync(
    resolve(routesDir, 'governance-rule-revisions.routes.ts'),
    'utf8',
  );

  it('shared helpers do not re-export response schema name duals', () => {
    expect(shared).toContain('Residual 681');
    expect(shared).not.toMatch(/export const RuleResponseSchema\b/);
    expect(shared).not.toMatch(/export const RuleRevisionResponseSchema\b/);
    expect(shared).not.toMatch(/export const GovernanceListRulesResponseSchema\b/);
    expect(shared).not.toMatch(/export const GovernanceSearchRulesResponseSchema\b/);
    expect(shared).not.toMatch(/export const GovernanceRuleRevisionsResponseSchema\b/);
    expect(shared).not.toMatch(/from '@memoflow\/contracts\/governance'/);
  });

  it('rules and revisions routes use contracts response schemas only', () => {
    expect(rules).toContain('RuleClientDTOSchema');
    expect(rules).toContain('ListRulesResSchema');
    expect(rules).toContain('SearchRulesResSchema');
    expect(rules).not.toContain('RuleResponseSchema');
    expect(rules).not.toContain('GovernanceListRulesResponseSchema');
    expect(rules).not.toContain('GovernanceSearchRulesResponseSchema');
    const ruleHits = rules.split('successResponse(RuleClientDTOSchema').length - 1;
    expect(ruleHits).toBeGreaterThanOrEqual(4);

    expect(revisions).toContain('GetRuleRevisionsResSchema');
    expect(revisions).not.toContain('GovernanceRuleRevisionsResponseSchema');
    expect(revisions).toContain('successResponse(GetRuleRevisionsResSchema');
  });
});
