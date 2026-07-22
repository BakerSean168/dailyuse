import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Legacy editor/repository runtime surface (stage-6 residual 167):
 * Old database note CRUD and Editor runtime must stay unmounted across
 * API composition, Desktop electron registration, and Vue routes.
 * Portable backup import of historical rows remains in data-portability only.
 * Residual 180: packages/editor package directory stays deleted (no runtime package).
 * Residual 182: root package.json scripts no longer list deleted editor Nx project.
 */
describe('legacy editor/repository runtime surface', () => {
  const repoRoot = resolve(__dirname, '../../../../../../../../');
  const repositoryRoutes = readFileSync(
    resolve(__dirname, '../../../../../api/routes/index.ts'),
    'utf8',
  );
  const repositoryApiIndex = readFileSync(
    resolve(__dirname, '../../../../../api/index.ts'),
    'utf8',
  );
  const applicationPort = readFileSync(
    resolve(__dirname, '../../../../application/repository.application.port.ts'),
    'utf8',
  );
  const applicationIndex = readFileSync(
    resolve(__dirname, '../../../../application/index.ts'),
    'utf8',
  );
  const repositoryModule = readFileSync(
    resolve(__dirname, '../../../repository.module.ts'),
    'utf8',
  );
  const repositoryRpcMap = readFileSync(
    resolve(repoRoot, 'packages/contracts/src/modules/repository/protocol/repository-rpc-map.ts'),
    'utf8',
  );
  const desktopMain = readFileSync(resolve(repoRoot, 'apps/desktop/src/main/main.ts'), 'utf8');
  const vueRepositoryRouter = readFileSync(
    resolve(repoRoot, 'packages/app-vue/src/modules/repository/router/index.ts'),
    'utf8',
  );
  const apiMain = readFileSync(resolve(repoRoot, 'apps/api/src/main.ts'), 'utf8');

  it('API repository routes only register knowledge-repository builders (residual 167)', () => {
    expect(repositoryRoutes).toContain('registerKnowledgeRepositoryConnectionRoutes');
    expect(repositoryRoutes).not.toContain('registerFolder');
    expect(repositoryRoutes).not.toContain('registerResource');
    expect(repositoryRoutes).not.toContain('registerBookmark');
    expect(repositoryRoutes).not.toContain('createEditor');
    expect(repositoryApiIndex).toContain('Legacy database Repository/Folder/');
    expect(repositoryApiIndex).toContain('createRepositoryApiModule');
  });

  it('application port exposes knowledge surface only (residual 167)', () => {
    expect(applicationPort).toContain('RepositoryApplicationPort');
    expect(applicationPort).toContain('startKnowledgeRepositoryInstallation');
    expect(applicationPort).toContain('listKnowledgeNoteProjections');
    expect(applicationPort).toContain('createConfirmedKnowledgeNote');
    expect(applicationPort).not.toMatch(/createFolder|updateFolder|deleteFolder/);
    expect(applicationPort).not.toMatch(/createResource|updateResource|deleteResource/);
    expect(applicationPort).not.toMatch(/createBookmark|deleteBookmark/);
    expect(applicationPort).not.toContain('SyncRepositoryUseCase');
    expect(applicationIndex).toContain('Knowledge-repository runtime surface only');
  });

  it('server module does not assemble legacy Folder/Resource CRUD (residual 167)', () => {
    expect(repositoryModule).toContain('confirmed note create');
    expect(repositoryModule).not.toContain('FolderUseCase');
    expect(repositoryModule).not.toContain('ResourceUseCase');
    expect(repositoryModule).not.toContain('BookmarkUseCase');
    expect(repositoryModule).not.toContain('SyncRepositoryUseCase');
  });

  it('contracts repository RPC map is empty (residual 167)', () => {
    expect(repositoryRpcMap).toContain('export type RepositoryRpcMap = Record<string, never>;');
    expect(repositoryRpcMap).toContain('Legacy database Repository/Resource/Folder/Bookmark');
  });

  it('Desktop main registers knowledge repository electron only, never Editor module (residual 167)', () => {
    expect(desktopMain).toContain('createRepositoryElectronModule');
    expect(desktopMain).toContain('.register(repositoryElectronModule)');
    expect(desktopMain).not.toContain('createEditorElectronModule');
    expect(desktopMain).not.toContain('EditorElectronModule');
    expect(desktopMain).not.toContain('createEditorModule');
  });

  it('API host mounts createRepositoryApiModule without editor module (residual 167)', () => {
    expect(apiMain).toContain('createRepositoryApiModule');
    expect(apiMain).toContain('.register(repositoryApiModule)');
    expect(apiMain).not.toContain('createEditorApiModule');
    expect(apiMain).not.toContain('EditorApiModule');
  });

  it('Vue repository router has no retired /note/:id editor path (residual 167)', () => {
    expect(vueRepositoryRouter).not.toContain("path: '/note");
    expect(vueRepositoryRouter).not.toContain('note-edit');
    expect(vueRepositoryRouter).not.toContain('note-editor');
  });

  it('SyncRepositoryUseCase source file stays deleted (residual 167)', () => {
    expect(
      existsSync(
        resolve(
          repoRoot,
          'packages/repository/src/server/application/use-cases/commands/sync-repository.use-case.ts',
        ),
      ),
    ).toBe(false);
  });

  it('packages/editor package directory stays deleted (residual 180)', () => {
    expect(existsSync(resolve(repoRoot, 'packages/editor'))).toBe(false);
    expect(existsSync(resolve(repoRoot, 'packages/editor/package.json'))).toBe(false);
  });

  it('app workspace package.json files do not depend on @dailyuse/editor (residual 180)', () => {
    const rootPkg = readFileSync(resolve(repoRoot, 'package.json'), 'utf8');
    expect(rootPkg).not.toContain('"@dailyuse/editor"');
    // apps that historically mounted editor must not reintroduce the dep:
    for (const rel of ['apps/api/package.json', 'apps/desktop/package.json', 'apps/web/package.json']) {
      const pkgPath = resolve(repoRoot, rel);
      if (!existsSync(pkgPath)) continue;
      const pkg = readFileSync(pkgPath, 'utf8');
      expect(pkg).not.toContain('"@dailyuse/editor"');
    }
  });


  it('root package.json scripts do not target deleted editor Nx project (residual 182)', () => {
    const rootPkg = JSON.parse(readFileSync(resolve(repoRoot, 'package.json'), 'utf8')) as {
      scripts?: Record<string, string>;
    };
    const integration = rootPkg.scripts?.['test:integration'] ?? '';
    const coverage = rootPkg.scripts?.['test:coverage:domain'] ?? '';
    // Match comma/equals-delimited project tokens only (avoid false positives on "editor_*" words).
    expect(integration).not.toMatch(/(?:^|[=,])editor(?:,|$|\s)/);
    expect(coverage).not.toMatch(/(?:^|[=,])editor(?:,|$|\s)/);
    // Positive: scripts still target live domain packages
    expect(integration).toContain('task');
    expect(coverage).toContain('goal');
  });

});
