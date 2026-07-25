import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { formatZodErrors } from './format-zod-errors';

/**
 * Residual 945: formatZodErrors dual retired.
 * Sole body in format-zod-errors.ts; express-adapter re-exports; ipc-adapter imports.
 * Soft residual 943: escapeHtml dual retired (shared/escape-html-dual.surface.spec.ts).
 * Does not flip §13.2 checkboxes.
 */
describe('formatZodErrors dual retired (residual 945)', () => {
  const resultDir = __dirname;
  const sole = readFileSync(resolve(resultDir, 'format-zod-errors.ts'), 'utf8');
  const express = readFileSync(resolve(resultDir, 'express-adapter.ts'), 'utf8');
  const ipc = readFileSync(resolve(resultDir, 'ipc-adapter.ts'), 'utf8');
  const index = readFileSync(resolve(resultDir, 'index.ts'), 'utf8');

  it('owns sole formatZodErrors helper body', () => {
    expect(sole).toContain('Residual 945');
    expect(sole).toMatch(/export function formatZodErrors\b/);
    expect(sole).toContain("code: 'INVALID_FIELD'");
    expect(sole).toContain('field: issue.path.map(String).join(\'.\')');
  });

  it('express re-exports and ipc imports without local dual bodies', () => {
    expect(express).toContain('Residual 945');
    expect(express).toContain("import { formatZodErrors } from './format-zod-errors'");
    expect(express).toContain('export { formatZodErrors }');
    expect(express).not.toMatch(/export function formatZodErrors\b/);
    expect(express).not.toMatch(/function formatZodErrors\b/);

    expect(ipc).toContain('Residual 945');
    expect(ipc).toContain("import { formatZodErrors } from './format-zod-errors'");
    expect(ipc).not.toMatch(/function formatZodErrors\b/);
    expect(ipc).toContain('formatZodErrors(parsed.error.issues)');
  });

  it('result barrel exports formatZodErrors from sole module', () => {
    expect(index).toContain('Residual 945');
    expect(index).toContain("export { formatZodErrors } from './format-zod-errors'");
    // not dual-exported only from express as sole definition site
    expect(index).not.toMatch(
      /export \{\s*expressAdapter,\s*formatZodErrors,/,
    );
  });

  it('maps zod issues to ResultErrorDetail fields', () => {
    expect(
      formatZodErrors([
        { path: ['email'], message: 'invalid' },
        { path: ['profile', 'name'], message: 'required' },
      ]),
    ).toEqual([
      { field: 'email', code: 'INVALID_FIELD', message: 'invalid' },
      { field: 'profile.name', code: 'INVALID_FIELD', message: 'required' },
    ]);
  });
});
