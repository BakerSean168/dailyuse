import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 783: governance list/search/revisions Res dual bodies retired.
 * Sole *ResSchema + z.infer in response-schemas; rules/rule-revisions drop dual bodies.
 *
 * Soft residual 821: RuleClientDTO / RuleRevisionClientDTO duals retired
 * (see rule-client-dto-dual surface).
 */
describe('governance list/search/revisions res duals retired (residual 783)', () => {
  const apiDir = __dirname;
  const responseSchemas = readFileSync(resolve(apiDir, 'response-schemas.ts'), 'utf8');
  const rules = readFileSync(resolve(apiDir, 'rules.ts'), 'utf8');
  const revisions = readFileSync(resolve(apiDir, 'rule-revisions.ts'), 'utf8');
  const listRoutes = readFileSync(
    resolve(apiDir, '../../../../../governance/src/api/routes/governance-rules.routes.ts'),
    'utf8',
  );
  const revisionRoutes = readFileSync(
    resolve(
      apiDir,
      '../../../../../governance/src/api/routes/governance-rule-revisions.routes.ts',
    ),
    'utf8',
  );

  it('response-schemas owns ResSchema + z.infer aliases', () => {
    expect(responseSchemas).toContain('Residual 783');
    expect(responseSchemas).toContain('export const ListRulesResSchema = z.object({');
    expect(responseSchemas).toContain(
      'export type ListRulesRes = z.infer<typeof ListRulesResSchema>',
    );
    expect(responseSchemas).toContain('export const SearchRulesResSchema = z.object({');
    expect(responseSchemas).toContain(
      'export type SearchRulesRes = z.infer<typeof SearchRulesResSchema>',
    );
    expect(responseSchemas).toContain(
      'export const GetRuleRevisionsResSchema = z.object({',
    );
    expect(responseSchemas).toContain(
      'export type GetRuleRevisionsRes = z.infer<typeof GetRuleRevisionsResSchema>',
    );
    expect(responseSchemas).not.toMatch(
      /export const ListRulesResSchema:\s*z\.ZodType</,
    );
    expect(responseSchemas).not.toMatch(
      /export const SearchRulesResSchema:\s*z\.ZodType</,
    );
    expect(responseSchemas).not.toMatch(
      /export const GetRuleRevisionsResSchema:\s*z\.ZodType</,
    );
  });

  it('rules/rule-revisions drop dual bodies with residual lock comments', () => {
    expect(rules).toContain('Residual 783');
    expect(rules).not.toMatch(/export type ListRulesRes\b/);
    expect(rules).not.toMatch(/export type SearchRulesRes\b/);
    expect(rules).not.toMatch(/export type ListRulesRes\s*=\s*\{/);
    expect(rules).not.toMatch(/export type SearchRulesRes\s*=\s*\{/);
    expect(revisions).toContain('Residual 783');
    expect(revisions).not.toMatch(/export type GetRuleRevisionsRes\b/);
    expect(revisions).not.toMatch(/export type GetRuleRevisionsRes\s*=\s*\{/);
  });

  it('OpenAPI routes use shared Res schemas without local dual bodies', () => {
    expect(listRoutes).toContain('ListRulesResSchema');
    expect(listRoutes).toContain('SearchRulesResSchema');
    expect(listRoutes).toContain("successResponse(ListRulesResSchema, '获取成功')");
    expect(listRoutes).toContain("successResponse(SearchRulesResSchema, '搜索成功')");
    expect(revisionRoutes).toContain('GetRuleRevisionsResSchema');
    expect(revisionRoutes).toContain(
      "successResponse(GetRuleRevisionsResSchema, '获取成功')",
    );
  });
});
