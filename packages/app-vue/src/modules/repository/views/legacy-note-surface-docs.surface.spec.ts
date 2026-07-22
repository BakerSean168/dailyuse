import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residuals 205/209/211: product module indexes, MSW, and goal-workflow e2e stay
 * aligned with knowledge-only note surface — no hard-fail CRUD dual-track,
 * no MSW legacy Resource/Folder stubs, no legacy-goal-workflow debug dual-track.
 */
describe('legacy note surface docs and menu dual-track retirement', () => {
  const repoRoot = resolve(__dirname, '../../../../../../');
  const editorIndex = readFileSync(
    resolve(repoRoot, 'docs/product/module-index/editor-files.md'),
    'utf8',
  );
  const repositoryIndex = readFileSync(
    resolve(repoRoot, 'docs/product/module-index/repository-files.md'),
    'utf8',
  );
  const httpAdapterSpec = readFileSync(
    resolve(
      repoRoot,
      'packages/repository/src/infrastructure-client/adapters/http/repository-http.adapter.spec.ts',
    ),
    'utf8',
  );
  const enLocale = readFileSync(resolve(repoRoot, 'packages/app-vue/src/locales/en-US.ts'), 'utf8');
  const zhLocale = readFileSync(resolve(repoRoot, 'packages/app-vue/src/locales/zh-CN.ts'), 'utf8');
  const mswHandlers = readFileSync(
    resolve(repoRoot, 'apps/web/src/mocks/handlers/repository.handlers.ts'),
    'utf8',
  );
  const goalWorkflowE2e = readFileSync(
    resolve(repoRoot, 'apps/web/e2e/ai/goal-workflow.spec.ts'),
    'utf8',
  );

  it('module indexes no longer claim hard-fail NOT_SUPPORTED CRUD stubs', () => {
    expect(editorIndex).not.toMatch(/硬失败\s*`?NOT_SUPPORTED`?/);
    expect(repositoryIndex).not.toMatch(/硬失败\s*`?NOT_SUPPORTED`?/);
    expect(editorIndex).toContain('无 legacy CRUD 方法');
    expect(repositoryIndex).toContain('无 legacy CRUD 方法');
    expect(repositoryIndex).not.toContain('legacy 硬失败');
    expect(repositoryIndex).not.toContain('legacy 404');
    expect(httpAdapterSpec).toContain('does not keep hard-fail stubs for retired CRUD methods');
  });

  it('indexes point at confirmed-create-only surface lock (residual 201)', () => {
    expect(editorIndex).toContain('confirmed-create-only-note-boundary.surface.spec.ts');
    expect(repositoryIndex).toContain('confirmed-create-only-note-boundary.surface.spec.ts');
  });

  it('MSW handlers stay knowledge-only without legacy Resource dual-track stubs', () => {
    expect(mswHandlers).toContain('knowledge-connections');
    expect(mswHandlers).toContain('knowledge-notes');
    expect(mswHandlers).not.toContain('Legacy repository route is not mounted');
    expect(mswHandlers).not.toMatch(/\/resources/);
    expect(repositoryIndex).toContain('MSW knowledge-only');
  });

  it('goal workflow e2e does not seed legacy-goal-workflow debug dual-track', () => {
    expect(goalWorkflowE2e).not.toMatch(/legacyGoalWorkflow\?:/);
    expect(goalWorkflowE2e).toContain(
      "legacyGoalWorkflowStorageKey: 'ai:debug:legacy-goal-workflow'",
    );
    expect(goalWorkflowE2e).toContain(
      'window.localStorage.removeItem(legacyGoalWorkflowStorageKey)',
    );
    expect(goalWorkflowE2e).not.toContain('setItem(legacyGoalWorkflowStorageKey');
  });

  it('menu locales drop repository bookmark dual-track keys and keep live template pause/enable', () => {
    for (const locale of [enLocale, zhLocale]) {
      expect(locale).not.toMatch(/addBookmark:\s*'/);
      expect(locale).not.toMatch(/removeBookmark:\s*'/);
      expect(locale).not.toMatch(/\bbookmark:\s*'/);
      expect(locale).toContain('pauseTemplate:');
      expect(locale).toContain('enableTemplate:');
    }
  });
});
