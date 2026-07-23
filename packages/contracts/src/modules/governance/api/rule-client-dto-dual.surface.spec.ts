import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

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
