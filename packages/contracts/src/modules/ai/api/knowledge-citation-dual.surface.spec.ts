import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 755: KnowledgeCitation dual body retired.
 * response-schemas owns KnowledgeCitationSchema; dto keeps z.infer type alias only.
 */
describe('knowledge citation dual retired (residual 755)', () => {
  const apiDir = __dirname;
  const responseSchemas = readFileSync(resolve(apiDir, 'response-schemas.ts'), 'utf8');
  const knowledge = readFileSync(resolve(apiDir, 'ai-knowledge-query.dto.ts'), 'utf8');

  it('response-schemas owns the sole citation schema body', () => {
    expect(responseSchemas).toContain('Residual 755');
    expect(responseSchemas).toContain(
      'export const KnowledgeCitationSchema = z.object({',
    );
    expect(responseSchemas).not.toMatch(
      /const KnowledgeCitationResSchema\s*=\s*z\.object\(\{/,
    );
    expect(responseSchemas).toContain('citations: z.array(KnowledgeCitationSchema)');
  });

  it('dto type is z.infer alias without local dual schema body', () => {
    expect(knowledge).toContain('Residual 755');
    expect(knowledge).toContain(
      "KnowledgeCitationSchema,\n  QueryKnowledgeResSchema,\n} from './response-schemas'",
    );
    expect(knowledge).toContain(
      'export type KnowledgeCitation = z.infer<typeof KnowledgeCitationSchema>',
    );
    expect(knowledge).not.toMatch(
      /export const KnowledgeCitationSchema\s*=\s*z\.object\(\{/,
    );
  });

  it('Query/Expand knowledge responses nest the shared citation schema', () => {
    expect(responseSchemas).toContain('export const QueryKnowledgeResSchema');
    expect(responseSchemas).toContain('export const ExpandKnowledgeResSchema');
    expect(knowledge).not.toContain('chunkIndex: z.number().int().nonnegative()');
  });
});
