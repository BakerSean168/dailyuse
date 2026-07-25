import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 274: ResultHttpClient implements canonical IResultHttpClient
 * (symmetry with ResultIpcClient implements IResultIpcClient).
 */
describe('ResultHttpClient IResultHttpClient single-track surface', () => {
  const types = readFileSync(resolve(__dirname, '../types.ts'), 'utf8');
  const client = readFileSync(resolve(__dirname, '../result-http-client.ts'), 'utf8');
  const index = readFileSync(resolve(__dirname, '../index.ts'), 'utf8');

  it('exports canonical IResultHttpClient and ResultHttpClient implements it', () => {
    expect(types).toContain('export interface IResultHttpClient');
    expect(client).toContain('implements IResultHttpClient');
    expect(index).toContain('IResultHttpClient');
    expect(index).toContain('ResultHttpClient');
  });
});
