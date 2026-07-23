import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createStreamId } from './create-stream-id';

/**
 * Residual 993: createStreamId dual retired (AI IPC stream adapters).
 * Sole body in create-stream-id.ts; assistant + message IPC adapters import it.
 * Soft residual 1028: tip focused suite numbers track Residual 1028 evidence tip (304/1319).
 * Does not flip §13.2 checkboxes.
 */
describe('createStreamId dual retired (residual 993)', () => {
  const dir = __dirname;
  const sole = readFileSync(resolve(dir, 'create-stream-id.ts'), 'utf8');
  const assistant = readFileSync(
    resolve(dir, '../infrastructure-client/adapters/ipc/ai-assistant-ipc.adapter.ts'),
    'utf8',
  );
  const message = readFileSync(
    resolve(dir, '../infrastructure-client/adapters/ipc/ai-message-ipc.adapter.ts'),
    'utf8',
  );

  it('owns sole createStreamId helper body', () => {
    expect(sole).toContain('Residual 993');
    expect(sole).toMatch(/export function createStreamId\b/);
    expect(sole).toContain('globalThis.crypto');
    expect(sole).toContain('randomUUID');
    expect(sole).toContain('stream-');
  });

  it('assistant + message IPC adapters import sole without local dual bodies', () => {
    for (const [label, source] of [
      ['assistant', assistant],
      ['message', message],
    ] as const) {
      expect(source, label).toContain('Residual 993');
      expect(source, label).toContain(
        "import { createStreamId } from '../../../shared/create-stream-id'",
      );
      expect(source, label).not.toMatch(/function createStreamId\b/);
      expect(source, label).toContain('createStreamId(');
    }
  });

  it('prefers randomUUID and falls back to stream- prefix', () => {
    const uuid = '11111111-2222-3333-4444-555555555555';
    const original = globalThis.crypto;
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: { randomUUID: () => uuid },
    });
    try {
      expect(createStreamId()).toBe(uuid);
    } finally {
      Object.defineProperty(globalThis, 'crypto', {
        configurable: true,
        value: original,
      });
    }

    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: {},
    });
    try {
      expect(createStreamId()).toMatch(/^stream-\d+-[0-9a-f]+$/);
    } finally {
      Object.defineProperty(globalThis, 'crypto', {
        configurable: true,
        value: original,
      });
    }
  });
});
