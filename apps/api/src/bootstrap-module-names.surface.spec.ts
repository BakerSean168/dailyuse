import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Elegance E5b: API bootstrap docs must not invent dead Legacy* module names.
 * Production registration lives in main.ts via AccountApiModule (and peers).
 */
describe('api bootstrap module names (elegance E5b)', () => {
  const dir = __dirname;
  const bootstrap = readFileSync(resolve(dir, 'bootstrap.ts'), 'utf8');
  const main = readFileSync(resolve(dir, 'main.ts'), 'utf8');

  it('example registers AccountApiModule; no retired account module alias in bootstrap', () => {
    expect(bootstrap).toContain('.register(AccountApiModule)');
    expect(bootstrap).toContain('Residual E5b');
    // Ban the historical fake module name in docs/example (E5 dead-domain).
    expect(bootstrap).not.toMatch(/LegacyAccountModule/);
    expect(bootstrap).not.toMatch(/\.register\(\s*Legacy\w*Module\s*\)/);
  });

  it('main wires AccountApiModule as the account API module', () => {
    expect(main).toContain("from '@memoflow/account/api'");
    expect(main).toContain('.register(AccountApiModule)');
    expect(main).not.toMatch(/LegacyAccountModule/);
  });
});
