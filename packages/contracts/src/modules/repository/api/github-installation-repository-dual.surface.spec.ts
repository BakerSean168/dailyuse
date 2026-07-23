import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 701: GitHub installation repository dual body retired.
 * GitHubInstallationRepositoryDTO reuses GitHubInstallationRepositorySchema only.
 */
describe('github installation repository dual retired (residual 701)', () => {
  const apiDir = __dirname;
  const dto = readFileSync(
    resolve(apiDir, 'knowledge-repository-connection.dto.ts'),
    'utf8',
  );
  const routes = readFileSync(
    resolve(
      apiDir,
      '../../../../../repository/src/api/routes/knowledge-repository-connection.routes.ts',
    ),
    'utf8',
  );

  it('exports GitHubInstallationRepositorySchema as sole repository shape', () => {
    expect(dto).toContain('Residual 701');
    expect(dto).toContain('export const GitHubInstallationRepositorySchema = z.object({');
    expect(dto).toContain(
      'repositories: z.array(GitHubInstallationRepositorySchema)',
    );
  });

  it('semantic DTO type is z.infer alias without interface dual body', () => {
    expect(dto).toContain(
      'export type GitHubInstallationRepositoryDTO = z.infer<typeof GitHubInstallationRepositorySchema>',
    );
    expect(dto).not.toMatch(/export interface GitHubInstallationRepositoryDTO\b/);
  });

  it('OpenAPI installation complete response uses repository schema array', () => {
    expect(routes).toContain('CompleteKnowledgeRepositoryInstallationResponseSchema');
    expect(dto).toContain('CompleteKnowledgeRepositoryInstallationResponseSchema');
  });
});
