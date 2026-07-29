import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 268: dashboard HTTP/IPC adapters use canonical transport ports only.
 * No local IResultHttpClient / IResultIpcClient interface duals.
 */
describe('dashboard adapter transport dual single-track surface', () => {
  const http = readFileSync(resolve(__dirname, 'dashboard-http.adapter.ts'), 'utf8');
  const ipc = readFileSync(resolve(__dirname, 'dashboard-ipc.adapter.ts'), 'utf8');

  it('HTTP adapter imports IResultHttpClient from @memoflow/http-client', () => {
    expect(http).toContain("from '@memoflow/http-client'");
    expect(http).toContain('IResultHttpClient');
    expect(http).not.toMatch(/interface IResultHttpClient\s*\{/);
  });

  it('IPC adapter imports IResultIpcClient from @memoflow/ipc-client', () => {
    expect(ipc).toContain("from '@memoflow/ipc-client'");
    expect(ipc).toContain('IResultIpcClient');
    expect(ipc).not.toMatch(/interface IResultIpcClient\s*\{/);
  });
});
