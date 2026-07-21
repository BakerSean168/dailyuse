import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * IPC client envelope surface (stage-6 residual 73):
 * Clients use contracts isIpcResultEnvelope and reject raw dual-track passthrough.
 */
describe('ipc-client envelope surface', () => {
  const impl = readFileSync(resolve(__dirname, '../ipc-client.ts'), 'utf8');
  const resultClient = readFileSync(resolve(__dirname, '../result-ipc-client.ts'), 'utf8');

  it('uses contracts isIpcResultEnvelope and rejects raw passthrough', () => {
    expect(impl).toContain('isIpcResultEnvelope');
    expect(impl).toContain("from '@dailyuse/contracts/result'");
    expect(impl).toContain('INVALID_IPC_RESULT');
    expect(impl).not.toContain('return response as T');
    expect(impl).not.toMatch(/console\.debug\(`\[IPC\] ← \$\{channel\} \(raw\)`\)/);

    expect(resultClient).toContain('isIpcResultEnvelope');
    expect(resultClient).toContain('not an IpcResult envelope');
    expect(resultClient).not.toContain('return ok(response as T)');
    expect(resultClient).not.toMatch(/console\.debug\(`\[IPC\] ← \$\{channel\} \(raw\)`\)/);
  });
});
