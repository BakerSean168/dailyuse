import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 699: knowledge repository installation response dual bodies retired.
 * Start/Complete Installation Res reuse *ResponseSchema only.
 */
describe('knowledge installation res dual retired (residual 699)', () => {
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

  it('exports installation ResponseSchemas as sole response shapes', () => {
    expect(dto).toContain('Residual 699');
    expect(dto).toContain(
      'export const StartKnowledgeRepositoryInstallationResponseSchema',
    );
    expect(dto).toContain(
      'export const CompleteKnowledgeRepositoryInstallationResponseSchema',
    );
  });

  it('semantic installation Res types are z.infer aliases without interface dual bodies', () => {
    expect(dto).toContain(
      'export type StartKnowledgeRepositoryInstallationRes = z.infer<',
    );
    expect(dto).toContain(
      'typeof StartKnowledgeRepositoryInstallationResponseSchema',
    );
    expect(dto).toContain(
      'export type CompleteKnowledgeRepositoryInstallationRes = z.infer<',
    );
    expect(dto).toContain(
      'typeof CompleteKnowledgeRepositoryInstallationResponseSchema',
    );
    expect(dto).not.toMatch(
      /export interface StartKnowledgeRepositoryInstallationRes\b/,
    );
    expect(dto).not.toMatch(
      /export interface CompleteKnowledgeRepositoryInstallationRes\b/,
    );
  });

  it('OpenAPI knowledge connection routes use installation ResponseSchemas only', () => {
    expect(routes).toContain('StartKnowledgeRepositoryInstallationResponseSchema');
    expect(routes).toContain(
      'successResponse(StartKnowledgeRepositoryInstallationResponseSchema',
    );
    expect(routes).toContain(
      'CompleteKnowledgeRepositoryInstallationResponseSchema',
    );
    expect(routes).toContain(
      'successResponse(CompleteKnowledgeRepositoryInstallationResponseSchema',
    );
  });
});
