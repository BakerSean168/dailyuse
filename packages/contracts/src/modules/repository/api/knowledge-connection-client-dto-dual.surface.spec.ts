import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 803: KnowledgeRepositoryConnectionClientDTO dual body retired.
 * Sole KnowledgeRepositoryConnectionClientSchema + z.infer (no installation tokens).
 * ServerDTO remains aggregate-owned (extra lastErrorMessage/version/deletedAt).
 */
describe('knowledge connection client dto dual retired (residual 803)', () => {
  const apiDir = __dirname;
  const dto = readFileSync(resolve(apiDir, 'knowledge-repository-connection.dto.ts'), 'utf8');
  const aggregate = readFileSync(
    resolve(apiDir, '../aggregates/knowledge-repository-connection.ts'),
    'utf8',
  );

  it('owns ClientDTO as z.infer of KnowledgeRepositoryConnectionClientSchema', () => {
    expect(dto).toContain('Residual 803');
    expect(dto).toContain(
      'export const KnowledgeRepositoryConnectionClientSchema = z.object({',
    );
    expect(dto).toContain(
      'export type KnowledgeRepositoryConnectionClientDTO = z.infer<',
    );
    expect(dto).toContain('typeof KnowledgeRepositoryConnectionClientSchema');
    expect(dto).not.toMatch(/export interface KnowledgeRepositoryConnectionClientDTO\b/);
  });

  it('drops aggregate ClientDTO interface dual; keeps ServerDTO', () => {
    expect(aggregate).toContain('Residual 803');
    expect(aggregate).not.toMatch(/export interface KnowledgeRepositoryConnectionClientDTO\b/);
    expect(aggregate).toContain('export interface KnowledgeRepositoryConnectionServerDTO');
    expect(aggregate).toContain('lastErrorMessage: string | null');
    expect(aggregate).toContain('version: number');
    expect(aggregate).toContain('deletedAt: TransferDate | null');
  });

  it('ClientSchema never carries installation tokens or private keys', () => {
    expect(dto).toContain('canSync: z.boolean()');
    expect(dto).toContain('installationId: z.string().min(1)');
    expect(dto).not.toMatch(/installationToken|privateKey|accessToken|clientSecret/);
    expect(dto).toContain('lastSyncedCommitSha: z.string().nullable()');
    expect(dto).toContain('lastProjectedCommitSha: z.string().nullable().optional()');
  });
});
