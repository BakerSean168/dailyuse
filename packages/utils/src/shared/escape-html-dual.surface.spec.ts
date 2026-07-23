import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { escapeHtml } from './escape-html';

/**
 * Residual 943: escapeHtml dual retired.
 * Sole body in @dailyuse/utils/shared/escape-html; desktop main + app-vue
 * safe-markdown import it (local function duals dropped).
 * Does not flip §13.2 checkboxes.
 */
describe('escapeHtml dual retired (residual 943)', () => {
  const sharedDir = __dirname;
  const sole = readFileSync(resolve(sharedDir, 'escape-html.ts'), 'utf8');
  const index = readFileSync(resolve(sharedDir, 'index.ts'), 'utf8');
  const safeMarkdown = readFileSync(
    resolve(sharedDir, '../../../app-vue/src/shared/utils/safe-markdown.ts'),
    'utf8',
  );
  const desktopMain = readFileSync(
    resolve(sharedDir, '../../../../apps/desktop/src/renderer/main.ts'),
    'utf8',
  );

  it('owns sole escapeHtml helper body and shared barrel export', () => {
    expect(sole).toContain('Residual 943');
    expect(sole).toMatch(/export function escapeHtml\b/);
    expect(sole).toContain(".replace(/&/g, '&amp;')");
    expect(sole).toContain(".replace(/</g, '&lt;')");
    expect(sole).toContain(".replace(/>/g, '&gt;')");
    expect(sole).toContain('.replace(/"/g, \'&quot;\')');
    expect(sole).toContain(".replace(/'/g, '&#39;')");
    expect(index).toContain("export * from './escape-html'");
  });

  it('desktop main and safe-markdown import sole helper without local dual bodies', () => {
    expect(desktopMain).toContain('Residual 943');
    expect(desktopMain).toContain("import { escapeHtml } from '@dailyuse/utils/shared'");
    expect(desktopMain).not.toMatch(/function escapeHtml\b/);

    expect(safeMarkdown).toContain('Residual 943');
    expect(safeMarkdown).toContain("import { escapeHtml } from '@dailyuse/utils/shared'");
    expect(safeMarkdown).not.toMatch(/function escapeHtml\b/);
  });

  it('escapes HTML special characters for untrusted text embedding', () => {
    expect(escapeHtml(`<script a="1" b='2'>&`)).toBe(
      '&lt;script a=&quot;1&quot; b=&#39;2&#39;&gt;&amp;',
    );
  });
});
