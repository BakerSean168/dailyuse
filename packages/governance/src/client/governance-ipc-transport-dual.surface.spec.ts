import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 272: governance client uses canonical IResultIpcClient.
 * No local GovernanceIpcTransport dual interface.
 */
describe('governance ipc transport dual single-track surface', () => {
  const client = readFileSync(resolve(__dirname, 'index.ts'), 'utf8');

  it('imports IResultIpcClient from @memoflow/ipc-client', () => {
    expect(client).toContain("from '@memoflow/ipc-client'");
    expect(client).toContain('IResultIpcClient');
    expect(client).toContain('createGovernanceIpcClient');
  });

  it('does not define GovernanceIpcTransport dual', () => {
    expect(client).not.toMatch(/export interface GovernanceIpcTransport\s*\{/);
    expect(client).not.toContain('GovernanceIpcTransport');
  });
});
