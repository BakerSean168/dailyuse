import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 773: ListKnowledgeRepositoryConnectionsRes dual body retired.
 * Res is z.infer of ListKnowledgeRepositoryConnectionsResSchema.
 * Soft residual 803: nested KnowledgeRepositoryConnectionClientDTO dual retired via ClientSchema
 * (see knowledge-connection-client-dto-dual surface; not asserted here to avoid dual-surface lock drift).
 */
describe('list knowledge connections res dual retired (residual 773)', () => {
  const dto = readFileSync(
    resolve(__dirname, 'knowledge-repository-connection.dto.ts'),
    'utf8',
  );

  it('owns sole list ResSchema body', () => {
    expect(dto).toContain('Residual 773');
    expect(dto).toContain(
      'export const ListKnowledgeRepositoryConnectionsResSchema = z.object({',
    );
    expect(dto).toContain(
      'connections: z.array(KnowledgeRepositoryConnectionClientSchema)',
    );
  });

  it('Res type is z.infer alias without object dual body', () => {
    expect(dto).toContain(
      'export type ListKnowledgeRepositoryConnectionsRes = z.infer<',
    );
    expect(dto).toContain('typeof ListKnowledgeRepositoryConnectionsResSchema');
    expect(dto).not.toMatch(
      /export type ListKnowledgeRepositoryConnectionsRes = \{\s*connections:/,
    );
  });

  it('nested connection transport uses ClientSchema', () => {
    expect(dto).toContain(
      'export const KnowledgeRepositoryConnectionClientSchema = z.object({',
    );
  });
});
