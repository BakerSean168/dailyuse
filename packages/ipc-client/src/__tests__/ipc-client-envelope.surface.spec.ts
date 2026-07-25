import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * IPC client envelope surface (stage-6 residual 73/81):
 * ResultIpcClient uses contracts isIpcResultEnvelope and rejects raw dual-track.
 * Throw-style dual client file is gone; package exports Result path only.
 */
describe('ipc-client envelope surface', () => {
  const resultClient = readFileSync(resolve(__dirname, '../result-ipc-client.ts'), 'utf8');
  const index = readFileSync(resolve(__dirname, '../index.ts'), 'utf8');
  const types = readFileSync(resolve(__dirname, '../types.ts'), 'utf8');

  it('ResultIpcClient uses contracts isIpcResultEnvelope and rejects raw passthrough', () => {
    expect(resultClient).toContain('isIpcResultEnvelope');
    expect(resultClient).toContain('not an IpcResult envelope');
    expect(resultClient).not.toContain('return ok(response as T)');
    expect(resultClient).not.toMatch(/console\.debug\(`\[IPC\] ← \$\{channel\} \(raw\)`\)/);
  });

  it('package public surface exports only Result path (throw dual-track removed)', () => {
    expect(index).toContain('ResultIpcClient');
    expect(index).toContain('createResultIpcClient');
    expect(index).not.toMatch(/export \{[^}]*ResultIpcClient[^}]*IpcClientError/);
    expect(index).not.toMatch(/export \{ IpcClientError/);
    expect(types).not.toMatch(/export interface IpcClient\s*[{]/);
    expect(types).not.toContain('export class IpcClientError');
    expect(existsSync(resolve(__dirname, '../ipc-client.ts'))).toBe(false);
  });
});
