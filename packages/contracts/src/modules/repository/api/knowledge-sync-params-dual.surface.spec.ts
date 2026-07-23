import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 669: knowledge-repository sync request dual body retired.
 * SyncKnowledgeRepositoryReq reuses KnowledgeRepositoryConnectionParamsSchema only.
 */
describe('knowledge sync params dual retired (residual 669)', () => {
  const apiDir = __dirname;
  const dto = readFileSync(resolve(apiDir, 'knowledge-repository-connection.dto.ts'), 'utf8');

  it('does not export a separate sync request zod dual body', () => {
    expect(dto).toContain('Residual 669');
    expect(dto).toContain('export const KnowledgeRepositoryConnectionParamsSchema');
    expect(dto).toContain(
      'export type SyncKnowledgeRepositoryReq = z.infer<typeof KnowledgeRepositoryConnectionParamsSchema>',
    );
    expect(dto).not.toMatch(/export const SyncKnowledgeRepositorySchema\b/);
  });

  it('disconnect still extends the shared connection params schema', () => {
    expect(dto).toContain(
      'KnowledgeRepositoryConnectionParamsSchema.extend({',
    );
  });

  it('desktop sync service parses KnowledgeRepositoryConnectionParamsSchema only', () => {
    const desktop = readFileSync(
      resolve(
        apiDir,
        '../../../../../../apps/desktop/src/main/modules/repository/desktop-knowledge-repository-sync.service.ts',
      ),
      'utf8',
    );
    expect(desktop).toContain('KnowledgeRepositoryConnectionParamsSchema.safeParse');
    expect(desktop).not.toContain('SyncKnowledgeRepositorySchema');
  });

});
