import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Portable editor backup boundary surface (stage-6 residual 193/303):
 * editor_* tables + data-portability import/export remain for business backup
 * re-import only. The runtime `@dailyuse/editor` package stays deleted; no host
 * remounts Editor API/Electron as a first-party editing surface.
 * Residual 303: lock Web-only server-held disclosure vs Desktop IPC export/import
 * split (no disclosure IPC channel).
 */
describe('portable editor backup boundary surface', () => {
  const repoRoot = resolve(__dirname, '../../../../../../../');
  const importUseCase = readFileSync(
    resolve(__dirname, '../import-user-data.use-case.ts'),
    'utf8',
  );
  const exportUseCase = readFileSync(
    resolve(__dirname, '../export-user-data.use-case.ts'),
    'utf8',
  );
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
  const contractsPkg = readFileSync(
    resolve(repoRoot, 'packages/contracts/package.json'),
    'utf8',
  );
  const apiMain = readFileSync(resolve(repoRoot, 'apps/api/src/main.ts'), 'utf8');
  const desktopMain = readFileSync(
    resolve(repoRoot, 'apps/desktop/src/main/main.ts'),
    'utf8',
  );
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

  it('runtime packages/editor stays deleted while portable schema remains', () => {
    expect(existsSync(resolve(repoRoot, 'packages/editor'))).toBe(false);
    expect(existsSync(resolve(repoRoot, 'packages/editor/package.json'))).toBe(false);
    expect(contractsPkg).not.toMatch(/"\.\/editor"/);
    expect(editorPrismaSchema).toContain('model EditorWorkspace');
    expect(editorPrismaSchema).toContain('@@map("editor_workspaces")');
    expect(existsSync(prepareEditorScript)).toBe(true);
  });

  it('hosts never remount Editor API/Electron runtime modules', () => {
    expect(apiMain).not.toContain('createEditorApiModule');
    expect(apiMain).not.toContain('EditorApiModule');
    expect(apiMain).not.toContain('@dailyuse/editor');
    expect(desktopMain).not.toContain('createEditorElectronModule');
    expect(desktopMain).not.toContain('createEditorModule');
    expect(desktopMain).not.toContain('@dailyuse/editor');
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
    expect(importUseCase).toContain("if (data.editor) await importEditor(tx, ctx, data.editor);");
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
    expect(importStore).toContain(
      'createEditorTab(input: CreateEditorTabInput): Promise<void>;',
    );
  });

  it('server-held disclosure remains a separate non-importable product surface', () => {
    const importSafety = readFileSync(
      resolve(
        repoRoot,
        'packages/contracts/src/modules/data-portability/rules/import-safety.ts',
      ),
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
    expect(electronModule).not.toMatch(/exportServerHeldDataDisclosure|server-held-data-disclosure/);

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

});
