import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Repository API runtime composer surface.
 * 仓库 API runtime composer 表面契约。
 *
 * Locks the Step C wiring: apps/api/src/main.ts must compose repository through
 * the runtime composer and must no longer reference the retired
 * `createRepositoryApiModule` transport factory or the `@memoflow/repository/api`
 * seam. The composer must only touch the narrow seams the plan allows.
 *
 * 锁定 Step C 接线：apps/api/src/main.ts 必须通过 runtime composer 组装仓库，
 * 且不再引用已退役的 `createRepositoryApiModule` transport 工厂或
 * `@memoflow/repository/api` seam。composer 只允许接触计划允许的窄 seam。
 */
describe('repository API runtime composer surface', () => {
  const dir = resolve(__dirname, '..');
  const main = readFileSync(resolve(dir, 'main.ts'), 'utf8');
  const composer = readFileSync(resolve(dir, 'runtime/compose-repository.ts'), 'utf8');

  it('main.ts composes repository via composeRepository({ db: prisma, storageBaseDir, closureChecker, githubApp, knowledgeRepositoryCloudDataPurger })', () => {
    expect(main).toContain("from './runtime/compose-repository'");
    expect(main).toMatch(
      /composeRepository\(\{\s*db: prisma,\s*storageBaseDir: repositoryStorageBaseDir,\s*closureChecker: accountActiveChecker,\s*githubApp: getGithubAppConfig\(\) \?\? undefined,\s*knowledgeRepositoryCloudDataPurger: new RepositoryKnowledgeCloudDataPurgerAdapter\(prisma\),?\s*\}/,
    );
    expect(main).toContain('.register(repositoryApiModule)');
  });

  it('main.ts no longer references createRepositoryApiModule or the repository/api seam', () => {
    expect(main).not.toMatch(/\bcreateRepositoryApiModule\b/);
    expect(main).not.toContain("from '@memoflow/repository/api'");
  });

  it('keeps getApplicationPort() as an explicit dependency of composeAI', () => {
    expect(main).toContain('repositoryApiModule.getApplicationPort()');
  });

  it('composer only touches the narrow seams (no deep server import)', () => {
    expect(composer).toContain('interface ComposeRepositoryDependencies');
    expect(composer).toContain("from '@memoflow/repository'");
    expect(composer).toContain("from '@memoflow/repository/api'");
    expect(composer).not.toMatch(/@memoflow\/repository\/server/);
  });
});
