import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * AI transport types surface (stage-6 residual 82):
 * infrastructure-client exposes Result-only transport ports — no throw-style
 * IIpcClient / IHttpClient dual-track re-exports.
 */
describe('ai infrastructure-client transport types surface', () => {
  const types = readFileSync(resolve(__dirname, '../types.ts'), 'utf8');
  const index = readFileSync(resolve(__dirname, '../../index.ts'), 'utf8');

  it('exports Result transport ports only', () => {
    expect(types).toContain('export type { IResultHttpClient }');
    expect(types).toContain('export interface IResultIpcClient');
    expect(types).not.toContain('export type { IHttpClient }');
    expect(types).not.toMatch(/export interface IIpcClient\s*[{]/);
    expect(types).not.toMatch(/invoke<T = unknown>\(channel: string, \.\.\.args: unknown\[\]\): Promise<T>;/);
  });

  it('package infrastructure-client index re-exports Result transports only', () => {
    expect(index).toContain('IResultHttpClient');
    expect(index).toContain('IResultIpcClient');
    expect(index).not.toMatch(/\bIHttpClient\b/);
    expect(index).not.toMatch(/\bIIpcClient\b/);
  });
});
