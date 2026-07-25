import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

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
