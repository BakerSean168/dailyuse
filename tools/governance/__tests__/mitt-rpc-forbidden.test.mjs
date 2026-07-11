import { describe, it, expect } from 'vitest';
import {
  findMittRpcViolations,
  isExemptPath,
  MITT_RPC_PATTERN,
} from '../lib/mitt-rpc-forbidden.mjs';

describe('MITT_RPC_PATTERN', () => {
  it('matches eventBus.invoke( and eventBus.handle(', () => {
    expect('await eventBus.invoke("x")').toMatch(MITT_RPC_PATTERN);
    expect('eventBus.handle("x", fn)').toMatch(MITT_RPC_PATTERN);
  });

  it('does not match legitimate Electron IPC', () => {
    expect('ipcMain.handle(CH, fn)').not.toMatch(MITT_RPC_PATTERN);
    expect('await ipcRenderer.invoke(CH)').not.toMatch(MITT_RPC_PATTERN);
    expect('bridge.invoke("auth:logout")').not.toMatch(MITT_RPC_PATTERN);
  });

  it('does not match send/on/off', () => {
    expect('eventBus.send("x", p)').not.toMatch(MITT_RPC_PATTERN);
    expect('eventBus.on("x", fn)').not.toMatch(MITT_RPC_PATTERN);
  });
});

describe('isExemptPath', () => {
  it('exempts ipc-client and infrastructure directories', () => {
    expect(isExemptPath('packages/ipc-client/src/client.ts')).toBe(true);
    expect(isExemptPath('packages/ai/src/infrastructure-server/adapters/x.ts')).toBe(true);
    expect(isExemptPath('packages/ai/src/infrastructure-client/adapters/x.ts')).toBe(true);
  });

  it('does not exempt ordinary business code', () => {
    expect(isExemptPath('packages/goal/src/application-server/x.ts')).toBe(false);
  });
});

describe('findMittRpcViolations', () => {
  it('flags eventBus.invoke/handle in business code (positive fixture)', () => {
    const files = [
      {
        relPath: 'packages/goal/src/application-server/bad.ts',
        content: `export async function f(eventBus) {\n  return eventBus.invoke('goal:get', { id });\n}`,
      },
    ];
    const { violations } = findMittRpcViolations(files);
    expect(violations).toHaveLength(1);
    expect(violations[0]).toMatchObject({
      file: 'packages/goal/src/application-server/bad.ts',
      method: 'invoke',
      line: 2,
    });
  });

  it('passes clean code and exempt directories (negative fixture)', () => {
    const files = [
      {
        relPath: 'packages/goal/src/application-server/good.ts',
        content: `eventBus.send('goal:created', p);\neventBus.on('task:done', fn);`,
      },
      {
        relPath: 'packages/ipc-client/src/impl.ts',
        content: `export class IpcClientImpl { invokeChannel() { return bus.invoke('x'); } }`,
      },
      {
        relPath: 'packages/ai/src/infrastructure-server/adapters/ipc.ts',
        content: `eventBus.handle('ai:x', fn);`,
      },
    ];
    const { violations, exemptHits } = findMittRpcViolations(files);
    expect(violations).toHaveLength(0);
    expect(exemptHits).toBe(1); // only the infrastructure file actually contained a hit
  });

  it('ignores matches inside comments', () => {
    const files = [
      {
        relPath: 'packages/goal/src/x.ts',
        content: `// legacy: eventBus.invoke('x')\n/* eventBus.handle('y', fn) */\nconst ok = true;`,
      },
    ];
    const { violations } = findMittRpcViolations(files);
    expect(violations).toHaveLength(0);
  });
});
