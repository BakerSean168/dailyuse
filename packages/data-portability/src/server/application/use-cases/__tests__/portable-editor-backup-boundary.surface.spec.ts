import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Portable editor backup boundary surface (stage-6 residual 193/303/539):
 * editor_* tables + data-portability import/export remain for business backup
 * re-import only. The runtime `@memoflow/editor` package stays deleted; no host
 * remounts Editor API/Electron as a first-party editing surface.
 * Residual 303: lock Web-only server-held disclosure vs Desktop IPC export/import
 * split (no disclosure IPC channel).
 * Residual 539: PowerSync editor_* + knowledge knowledge-only routes + Vue /note
 * retirement stay dual-track closed (backup continuity only, not product editor).
 * Residual 885 (soft): portable boundary re-lock surface
 *   (portable-boundary-re-lock.surface.spec.ts).
 */
describe('portable editor backup boundary surface', () => {
  const repoRoot = resolve(__dirname, '../../../../../../../');
  const importUseCase = readFileSync(resolve(__dirname, '../import-user-data.use-case.ts'), 'utf8');
  const exportUseCase = readFileSync(resolve(__dirname, '../export-user-data.use-case.ts'), 'utf8');
  const editorImporter = readFileSync(
    resolve(__dirname, '../importers/editor.importer.ts'),
    'utf8',
  );
  const editorProjection = readFileSync(
    resolve(__dirname, '../projections/editor.projection.ts'),
    'utf8',
  );
  const importStore = readFileSync(
    resolve(__dirname, '../../import-store/data-portability-import-store.ts'),
    'utf8',
  );
  const editorPrismaSchema = readFileSync(
    resolve(repoRoot, 'packages/database/prisma/schema/editor.prisma'),
    'utf8',
  );
  const prepareEditorScript = resolve(
    repoRoot,
    'packages/database/scripts/prepare-editor-workspace-natural-key.ts',
  );
  const contractsPkg = readFileSync(resolve(repoRoot, 'packages/contracts/package.json'), 'utf8');
  const apiServer = readFileSync(resolve(repoRoot, 'apps/api/src/server.ts'), 'utf8');
  const desktopMain = readFileSync(resolve(repoRoot, 'apps/desktop/src/main/main.ts'), 'utf8');
  const ipcChannels = readFileSync(
    resolve(repoRoot, 'packages/contracts/src/electron/ipc-channels.ts'),
    'utf8',
  );
  const electronModule = readFileSync(
    resolve(repoRoot, 'packages/data-portability/src/electron/index.ts'),
    'utf8',
  );
  const ipcAdapter = readFileSync(
    resolve(
      repoRoot,
      'packages/data-portability/src/infrastructure-client/adapters/ipc/data-portability-ipc.adapter.ts',
    ),
    'utf8',
  );
  const httpAdapter = readFileSync(
    resolve(
      repoRoot,
      'packages/data-portability/src/infrastructure-client/adapters/http/data-portability-http.adapter.ts',
    ),
    'utf8',
  );
  const apiRoutes = readFileSync(
    resolve(repoRoot, 'packages/data-portability/src/api/routes.ts'),
    'utf8',
  );
  const editorProductDoc = readFileSync(
    resolve(repoRoot, 'docs/product/modules/editor.md'),
    'utf8',
  );
  const repositoryProductDoc = readFileSync(
    resolve(repoRoot, 'docs/product/modules/repository.md'),
    'utf8',
  );
  const powersyncTableMapping = readFileSync(
    resolve(repoRoot, 'apps/api/src/modules/powersync/table-mapping.ts'),
    'utf8',
  );
  const desktopPowersync = readFileSync(
    resolve(repoRoot, 'apps/desktop/src/main/database/powersync.ts'),
    'utf8',
  );
  const repositoryRoutesIndex = readFileSync(
    resolve(repoRoot, 'packages/repository/src/api/routes/index.ts'),
    'utf8',
  );
  const appShellStore = readFileSync(
    resolve(repoRoot, 'packages/app-vue/src/layouts/shell/useAppShellStore.ts'),
    'utf8',
  );

  it('runtime packages/editor stays deleted while portable schema remains', () => {
    expect(existsSync(resolve(repoRoot, 'packages/editor'))).toBe(false);
    expect(existsSync(resolve(repoRoot, 'packages/editor/package.json'))).toBe(false);
    expect(contractsPkg).not.toMatch(/"\.\/editor"/);
    expect(editorPrismaSchema).toContain('model EditorWorkspace');
    expect(editorPrismaSchema).toContain('@@map("editor_workspaces")');
    expect(existsSync(prepareEditorScript)).toBe(true);
  });

  it('hosts never remount Editor API/Electron runtime modules', () => {
    expect(apiServer).not.toContain('createEditorApiModule');
    expect(apiServer).not.toContain('EditorApiModule');
    expect(apiServer).not.toContain('@memoflow/editor');
    expect(desktopMain).not.toContain('createEditorElectronModule');
    expect(desktopMain).not.toContain('createEditorModule');
    expect(desktopMain).not.toContain('@memoflow/editor');
  });

  it('user-data export can project editor workspaces by identityId', () => {
    expect(exportUseCase).toContain("if (modules.includes('editor'))");
    expect(exportUseCase).toContain(
      'const workspaces = await this.deps.editorWorkspaceRepository.findByIdentityId(identityId);',
    );
    expect(exportUseCase).toContain('projectEditorWorkspaces(workspaces, ctx, this.deps)');
    expect(editorProjection).toContain('export async function projectEditorWorkspaces(');
  });

  it('user-data import rehydrates editor tables via identity-scoped importer', () => {
    expect(importUseCase).toContain('if (data.editor) await importEditor(tx, ctx, data.editor);');
    expect(editorImporter).toContain('export async function importEditor(');
    expect(editorImporter).toContain('identityId: ctx.identityId');
    // Every editor create path stamps import identity (not portable author identity alone).
    const identityStamps = editorImporter.match(/identityId:\s*ctx\.identityId/g);
    expect(identityStamps).not.toBeNull();
    expect(identityStamps!.length).toBeGreaterThanOrEqual(4);
    expect(importStore).toContain(
      'createEditorWorkspace(input: CreateEditorWorkspaceInput): Promise<void>;',
    );
    expect(importStore).toContain(
      'createEditorSession(input: CreateEditorSessionInput): Promise<void>;',
    );
    expect(importStore).toContain(
      'createEditorGroup(input: CreateEditorGroupInput): Promise<void>;',
    );
    expect(importStore).toContain('createEditorTab(input: CreateEditorTabInput): Promise<void>;');
  });

  it('server-held disclosure remains a separate non-importable product surface', () => {
    const importSafety = readFileSync(
      resolve(repoRoot, 'packages/contracts/src/modules/data-portability/rules/import-safety.ts'),
      'utf8',
    );
    expect(importSafety).toContain("kind === 'memoflow.server-held-data-disclosure'");
    expect(importSafety).toContain('not importable');
    // Editor backup is part of user-data-export, not disclosure.
    expect(importSafety).toContain('memoflow.user-data-export');
  });

  it('Web-only server-held disclosure vs Desktop portable export/import split (residual 303)', () => {
    // No disclosure IPC channel — only portable user-data export/import.
    const channelsBlock = ipcChannels.slice(
      ipcChannels.indexOf('export const DataPortabilityChannels'),
      ipcChannels.indexOf('export const WindowChannels'),
    );
    expect(channelsBlock).toContain("EXPORT: 'data-portability:export'");
    expect(channelsBlock).toContain("IMPORT: 'data-portability:import'");
    expect(channelsBlock).not.toMatch(/DISCLOSURE|server-held|serverHeld/i);

    expect(electronModule).toContain('DataPortabilityChannels.EXPORT');
    expect(electronModule).toContain('DataPortabilityChannels.IMPORT');
    expect(electronModule).not.toMatch(
      /exportServerHeldDataDisclosure|server-held-data-disclosure/,
    );

    // Renderer IPC adapter fail-closed; HTTP posts dedicated non-import route.
    expect(ipcAdapter).toContain('exportServerHeldDataDisclosure');
    expect(ipcAdapter).toContain("code: 'NOT_SUPPORTED'");
    expect(httpAdapter).toContain('/server-held-data-disclosure');
    expect(apiRoutes).toContain("path: '/server-held-data-disclosure'");
    expect(apiRoutes).toContain('exportServerHeldDataDisclosure');
  });

  it('product docs keep portable editor backup and server-held disclosure distinct', () => {
    expect(editorProductDoc).toContain('可重新导入业务数据备份');
    expect(editorProductDoc).toContain('不再构成运行时编辑通道');
    expect(editorProductDoc).toContain('memoflow.server-held-data-disclosure');
    expect(editorProductDoc).toContain('Web 可下');
    expect(editorProductDoc).toContain('Desktop 明确不支持');

    expect(repositoryProductDoc).toContain('memoflow.user-data-export');
    expect(repositoryProductDoc).toContain('memoflow.server-held-data-disclosure');
    expect(repositoryProductDoc).toContain('没有 import route');
  });

  it('PowerSync editor_* remains backup continuity only (residual 539)', () => {
    expect(powersyncTableMapping).toContain('Residual 539');
    expect(powersyncTableMapping).toContain("'editor_workspaces'");
    expect(powersyncTableMapping).toContain("'editor_workspace_sessions'");
    expect(powersyncTableMapping).toContain('portable backup');
    expect(powersyncTableMapping).toContain('@memoflow/editor');
    expect(desktopPowersync).toContain('Residual 539');
    expect(desktopPowersync).toContain("'editor_workspaces'");
    expect(desktopPowersync).toContain('portable backup continuity');
    // Still no first-party editor package / host remount.
    expect(existsSync(resolve(repoRoot, 'packages/editor'))).toBe(false);
    expect(apiServer).not.toContain('@memoflow/editor');
    expect(desktopMain).not.toContain('@memoflow/editor');
  });

  it('repository API mounts knowledge-only routes without Folder/Resource CRUD (residual 539)', () => {
    expect(repositoryRoutesIndex).toContain('Residual 539');
    expect(repositoryRoutesIndex).toContain('registerKnowledgeRepositoryConnectionRoutes');
    expect(repositoryRoutesIndex).toContain(
      'Legacy database Repository/Folder/Resource CRUD builders are gone',
    );
    expect(repositoryRoutesIndex).not.toMatch(
      /registerFolderRoutes|registerResourceRoutes|FolderResourceController/,
    );
    expect(repositoryRoutesIndex).not.toContain('registerFolder');
    expect(repositoryRoutesIndex).not.toContain('registerResource');
    expect(repositoryRoutesIndex).not.toContain('createEditorApiModule');
  });

  it('Vue shell strips retired /note editor routes from persisted tabs (residual 539)', () => {
    expect(appShellStore).toContain('Residual 539');
    expect(appShellStore).toContain("tab.route === '/note'");
    expect(appShellStore).toContain("tab.route.startsWith('/note/')");
    expect(appShellStore).toContain("tab.route.startsWith('/note?')");
    expect(appShellStore).toContain('sanitizeLegacyTabs');
  });
});
