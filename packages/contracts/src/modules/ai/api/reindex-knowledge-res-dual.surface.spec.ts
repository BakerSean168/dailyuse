import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 761: ReindexKnowledgeRes dual body retired.
 * OpenAPI + transport use ReindexKnowledgeResSchema; Res is z.infer alias.
 */
describe('reindex knowledge res dual retired (residual 761)', () => {
  const apiDir = __dirname;
  const dto = readFileSync(resolve(apiDir, 'ai-knowledge-query.dto.ts'), 'utf8');
  const routes = readFileSync(
    resolve(apiDir, '../../../../../ai/src/api/routes/ai-knowledge-query.routes.ts'),
    'utf8',
  );

  it('dto owns ReindexKnowledgeResSchema and z.infer Res alias', () => {
    expect(dto).toContain('Residual 761');
    expect(dto).toContain(
      'export const ReindexKnowledgeResSchema = z.object({',
    );
    expect(dto).toContain(
      'export type ReindexKnowledgeRes = z.infer<typeof ReindexKnowledgeResSchema>',
    );
    expect(dto).not.toMatch(/export interface ReindexKnowledgeRes\b/);
  });

  it('OpenAPI reindex route uses shared Res schema (no inline dual body)', () => {
    expect(routes).toContain('ReindexKnowledgeResSchema');
    expect(routes).toContain(
      "successResponse(ReindexKnowledgeResSchema, '重建成功')",
    );
    expect(routes).not.toMatch(
      /successResponse\(\s*z\.object\(\{[\s\S]*indexedCount/,
    );
  });

  it('result item schema remains nested under Res schema', () => {
    expect(dto).toContain('export const ReindexKnowledgeResultItemSchema');
    expect(dto).toContain('results: z.array(ReindexKnowledgeResultItemSchema)');
  });
});
