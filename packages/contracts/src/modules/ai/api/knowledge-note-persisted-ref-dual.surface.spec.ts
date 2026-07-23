import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 723: knowledge note persisted-ref dual body retired.
 * KnowledgeNotePersistedRef reuses KnowledgeNotePersistedRefSchema only.
 */
describe('knowledge note persisted-ref dual retired (residual 723)', () => {
  const apiDir = __dirname;
  const dto = readFileSync(resolve(apiDir, 'ai-knowledge-note.dto.ts'), 'utf8');
  const responseSchemas = readFileSync(resolve(apiDir, 'response-schemas.ts'), 'utf8');
  const resSurface = readFileSync(
    resolve(apiDir, 'ai-response-res-dual.surface.spec.ts'),
    'utf8',
  );

  it('exports KnowledgeNotePersistedRefSchema as sole persisted-ref shape', () => {
    expect(responseSchemas).toContain('Residual 723');
    expect(responseSchemas).toContain(
      'export const KnowledgeNotePersistedRefSchema = z.object({',
    );
  });

  it('semantic type is z.infer alias without interface dual body', () => {
    expect(dto).toContain('Residual 723');
    expect(dto).toContain(
      'export type KnowledgeNotePersistedRef = z.infer<typeof KnowledgeNotePersistedRefSchema>',
    );
    expect(dto).not.toMatch(/export interface KnowledgeNotePersistedRef\b/);
  });

  it('CreateKnowledgeNoteRes still nests KnowledgeNotePersistedRefSchema note', () => {
    expect(responseSchemas).toContain('note: KnowledgeNotePersistedRefSchema');
    expect(dto).toContain(
      'export type CreateKnowledgeNoteRes = z.infer<typeof CreateKnowledgeNoteResSchema>',
    );
    // residual 695 surface remains for CreateKnowledgeNoteRes dual
    expect(resSurface).toContain('CreateKnowledgeNoteResSchema');
  });
});
