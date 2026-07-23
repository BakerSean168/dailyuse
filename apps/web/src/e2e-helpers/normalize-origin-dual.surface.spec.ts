import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { normalizeOrigin } from '../../e2e/helpers/normalize-origin';

/**
 * Residual 1027: web e2e normalizeOrigin dual retired onto e2e/helpers sole.
 * Soft residual: desktop main trimTrailingSlash remains keep-boundary (same body, different host).
 * Soft residual: e2e sync credentials inline replace(/\/+$/, '') remains keep-boundary (not dual fn).
 * Soft residual 1032: tip focused suite numbers track Residual 1032 evidence tip (306/1327).
 * Does not flip §13.2 checkboxes.
 */
describe('normalizeOrigin dual retired (residual 1027)', () => {
  const root = resolve(__dirname, '../..');
  const sole = readFileSync(resolve(root, 'e2e/helpers/normalize-origin.ts'), 'utf8');
  const playwrightServer = readFileSync(resolve(root, 'playwright.server.ts'), 'utf8');
  const startApiServer = readFileSync(resolve(root, 'e2e/helpers/start-api-server.ts'), 'utf8');

  it('owns sole normalizeOrigin helper body', () => {
    expect(sole).toContain('Residual 1027');
    expect(sole).toMatch(/export function normalizeOrigin\b/);
    expect(sole).toContain("origin.replace(/\\/+$/, '')");
  });

  it('playwright.server imports sole without local dual body', () => {
    expect(playwrightServer).toContain('Residual 1027');
    expect(playwrightServer).toContain(
      "import { normalizeOrigin } from './e2e/helpers/normalize-origin'",
    );
    expect(playwrightServer).not.toMatch(/function normalizeOrigin\b/);
    expect(playwrightServer).toContain('normalizeOrigin(');
  });

  it('start-api-server imports sole without local dual body', () => {
    expect(startApiServer).toContain('Residual 1027');
    expect(startApiServer).toContain("import { normalizeOrigin } from './normalize-origin'");
    expect(startApiServer).not.toMatch(/function normalizeOrigin\b/);
    expect(startApiServer).toContain('normalizeOrigin(');
  });

  it('strips trailing slashes and leaves bare origins unchanged', () => {
    expect(normalizeOrigin('http://localhost:3000')).toBe('http://localhost:3000');
    expect(normalizeOrigin('http://localhost:3000/')).toBe('http://localhost:3000');
    expect(normalizeOrigin('http://localhost:3000///')).toBe('http://localhost:3000');
    expect(normalizeOrigin('https://example.com/api/')).toBe('https://example.com/api');
  });
});
