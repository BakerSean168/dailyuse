import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 205: product module indexes and menu locales stay aligned with the
 * post-hard-fail-stub knowledge surface — no NOT_SUPPORTED CRUD dual-track,
 * no repository bookmark menu dual-track after packages/editor + Resource CRUD
 * retirement.
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

  it('module indexes no longer claim hard-fail NOT_SUPPORTED CRUD stubs', () => {
    expect(editorIndex).not.toMatch(/硬失败\s*`?NOT_SUPPORTED`?/);
    expect(repositoryIndex).not.toMatch(/硬失败\s*`?NOT_SUPPORTED`?/);
    expect(editorIndex).toContain('无 legacy CRUD 方法');
    expect(repositoryIndex).toContain('无 legacy CRUD 方法');
    expect(httpAdapterSpec).toContain('does not keep hard-fail stubs for retired CRUD methods');
  });

  it('indexes point at confirmed-create-only surface lock (residual 201)', () => {
    expect(editorIndex).toContain('confirmed-create-only-note-boundary.surface.spec.ts');
    expect(repositoryIndex).toContain('confirmed-create-only-note-boundary.surface.spec.ts');
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
