import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Residual 615: contracts/result ships only Result / IpcResult / HttpResponse envelopes.
 * Legacy success-boolean action dual-track helpers are deleted (zero runtime consumers).
 */
const here = dirname(fileURLToPath(import.meta.url));

function read(name: string): string {
  return readFileSync(join(here, name), 'utf8');
}

describe('contracts result action dual-track retired (residual 615)', () => {
  it('result index does not re-export action dual helpers', () => {
    const index = read('index.ts');
    expect(index).toContain('Residual 615');
    expect(index).not.toContain("from './action'");
    expect(index).not.toMatch(/export\s*\{[^}]*\bactionOk\b/);
    expect(index).not.toMatch(/export\s*\{[^}]*\bactionFail\b/);
    expect(index).not.toMatch(/export\s*\{[^}]*\bisActionOk\b/);
    expect(index).not.toMatch(/export\s*\{[^}]*\bisActionFail\b/);
    expect(index).not.toMatch(/export\s*\{[^}]*\bcountResult\b/);
    expect(index).not.toMatch(/export\s*\{[^}]*\bbatchActionResult\b/);
    expect(index).not.toMatch(/export\s*\{[^}]*\bActionResult\b/);
  });

  it('action.ts dual-track module is gone', () => {
    let exists = true;
    try {
      read('action.ts');
    } catch {
      exists = false;
    }
    expect(exists).toBe(false);
  });

  it('canonical result package still exports Result envelopes', () => {
    const index = read('index.ts');
    expect(index).toContain("export * from './core'");
    expect(index).toContain('toIpcResult');
    expect(index).toContain('toHttpResponse');
  });
});
