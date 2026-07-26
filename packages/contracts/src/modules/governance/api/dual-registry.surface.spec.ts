/**
 * Dual registry suite (elegance E3b tax cut).
 * Merged 3 dual-retired surface locks from this directory.
 * Behavior/assertions preserved; individual *-dual.surface.spec.ts removed.
 * Sources: governance-snippet-tag-dual.surface.spec.ts, list-search-revisions-res-dual.surface.spec.ts, rule-client-dto-dual.surface.spec.ts
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// --- merged from governance-snippet-tag-dual.surface.spec.ts ---
{
  /**
   * Residual 731: governance code-snippet / rule-tag dual bodies retired.
   * CodeSnippetDTO / RuleTagDTO reuse *DTOSchema only (VO-owned).
   */
  describe('governance snippet/tag dual retired (residual 731)', () => {
    const apiDir = __dirname;
    const snippet = readFileSync(
      resolve(apiDir, '../value-objects/code-snippet.ts'),
      'utf8',
    );
    const tag = readFileSync(resolve(apiDir, '../value-objects/rule-tag.ts'), 'utf8');
    const responseSchemas = readFileSync(resolve(apiDir, 'response-schemas.ts'), 'utf8');

    it('exports snippet/tag schemas as sole shapes from VO modules', () => {
      expect(snippet).toContain('Residual 731');
      expect(snippet).toContain('export const CodeSnippetDTOSchema = z.object({');
      expect(tag).toContain('Residual 731');
      expect(tag).toContain('export const RuleTagDTOSchema = z.object({');
    });

    it('semantic DTOs are z.infer aliases without interface dual bodies', () => {
      expect(snippet).toContain(
        'export type CodeSnippetDTO = z.infer<typeof CodeSnippetDTOSchema>',
      );
      expect(snippet).not.toMatch(/export interface CodeSnippetDTO\b/);
      expect(tag).toContain(
        'export type RuleTagDTO = z.infer<typeof RuleTagDTOSchema>',
      );
      expect(tag).not.toMatch(/export interface RuleTagDTO\b/);
    });

    it('response-schemas re-exports VO-owned schemas (no local dual bodies)', () => {
      expect(responseSchemas).toContain('Residual 731');
      expect(responseSchemas).toContain("from '../value-objects/code-snippet'");
      expect(responseSchemas).toContain("from '../value-objects/rule-tag'");
      expect(responseSchemas).toContain(
        'export { CodeSnippetDTOSchema, RuleTagDTOSchema }',
      );
      expect(responseSchemas).not.toMatch(
        /export const CodeSnippetDTOSchema(?::\s*z\.ZodType)?\s*=\s*z\.object/,
      );
      expect(responseSchemas).not.toMatch(
        /export const RuleTagDTOSchema(?::\s*z\.ZodType)?\s*=\s*z\.object/,
      );
      expect(responseSchemas).toContain('tags: z.array(RuleTagDTOSchema)');
      expect(responseSchemas).toContain('goodExamples: z.array(CodeSnippetDTOSchema)');
    });
  });
}

// --- merged from list-search-revisions-res-dual.surface.spec.ts ---
{
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
}

// --- merged from rule-client-dto-dual.surface.spec.ts ---
{
  /**
   * Residual 821: RuleClientDTO / RuleRevisionClientDTO dual bodies retired.
   * Sole *ClientDTOSchema + z.infer (no ZodType<Interface> dual annotation).
   */
  describe('governance rule client dto duals retired (residual 821)', () => {
    const apiDir = __dirname;
    const responseSchemas = readFileSync(resolve(apiDir, 'response-schemas.ts'), 'utf8');
    const rule = readFileSync(resolve(apiDir, '../aggregates/rule-client.ts'), 'utf8');
    const revision = readFileSync(
      resolve(apiDir, '../entities/rule-revision-client.ts'),
      'utf8',
    );

    it('owns RuleClientDTO as z.infer of RuleClientDTOSchema', () => {
      expect(rule).toContain('Residual 821');
      expect(rule).toContain("from '../api/response-schemas'");
      expect(rule).toContain(
        'export type RuleClientDTO = z.infer<typeof RuleClientDTOSchema>',
      );
      expect(rule).not.toMatch(/export interface RuleClientDTO\b/);
      expect(responseSchemas).toContain('Residual 821');
      expect(responseSchemas).toContain('export const RuleClientDTOSchema = z.object({');
      expect(responseSchemas).not.toMatch(
        /export const RuleClientDTOSchema:\s*z\.ZodType<RuleClientDTO>/,
      );
    });

    it('owns RuleRevisionClientDTO as z.infer of RuleRevisionClientDTOSchema', () => {
      expect(revision).toContain('Residual 821');
      expect(revision).toContain("from '../api/response-schemas'");
      expect(revision).toContain(
        'export type RuleRevisionClientDTO = z.infer<typeof RuleRevisionClientDTOSchema>',
      );
      expect(revision).not.toMatch(/export interface RuleRevisionClientDTO\b/);
      expect(responseSchemas).toContain(
        'export const RuleRevisionClientDTOSchema = z.object({',
      );
      expect(responseSchemas).not.toMatch(
        /export const RuleRevisionClientDTOSchema:\s*z\.ZodType<RuleRevisionClientDTO>/,
      );
      expect(responseSchemas).toContain('previousValues: z.record(z.string(), z.unknown())');
      expect(responseSchemas).toContain('newValues: z.record(z.string(), z.unknown())');
    });

    it('list/search/revisions envelopes nest Rule/RuleRevision ClientDTOSchema arrays', () => {
      expect(responseSchemas).toContain('items: z.array(RuleClientDTOSchema)');
      expect(responseSchemas).toContain('items: z.array(RuleRevisionClientDTOSchema)');
      expect(responseSchemas).toContain('tags: z.array(RuleTagDTOSchema)');
      expect(responseSchemas).toContain('goodExamples: z.array(CodeSnippetDTOSchema)');
    });
  });
}
