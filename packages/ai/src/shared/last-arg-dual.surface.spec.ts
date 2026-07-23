import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { lastArg } from './last-arg';

/**
 * Residual 997: lastArg dual retired (AI IPC stream adapters).
 * Sole body in last-arg.ts; assistant + message IPC adapters import it.
 * Soft residual 1016: tip focused suite numbers track Residual 1016 evidence tip (298/1295).
 * Soft residual 993: createStreamId dual retired (create-stream-id-dual.surface.spec.ts).
 * Does not flip §13.2 checkboxes.
 */
describe('lastArg dual retired (residual 997)', () => {
  const dir = __dirname;
  const sole = readFileSync(resolve(dir, 'last-arg.ts'), 'utf8');
  const assistant = readFileSync(
    resolve(dir, '../infrastructure-client/adapters/ipc/ai-assistant-ipc.adapter.ts'),
    'utf8',
  );
  const message = readFileSync(
    resolve(dir, '../infrastructure-client/adapters/ipc/ai-message-ipc.adapter.ts'),
    'utf8',
  );

  it('owns sole lastArg helper body', () => {
    expect(sole).toContain('Residual 997');
    expect(sole).toMatch(/export function lastArg\b/);
    expect(sole).toContain('args.length > 0');
    expect(sole).toContain('args[args.length - 1]');
  });

  it('assistant + message IPC adapters import sole without local dual bodies', () => {
    for (const [label, source] of [
      ['assistant', assistant],
      ['message', message],
    ] as const) {
      expect(source, label).toContain('Residual 997');
      expect(source, label).toContain("import { lastArg } from '../../../shared/last-arg'");
      expect(source, label).not.toMatch(/function lastArg\b/);
      expect(source, label).toContain('lastArg<');
    }
  });

  it('returns last variadic argument or undefined', () => {
    expect(lastArg([])).toBeUndefined();
    expect(lastArg([1, 2, 3])).toBe(3);
    expect(lastArg(['a'])).toBe('a');
    expect(lastArg([{ streamId: 's' }])).toEqual({ streamId: 's' });
  });
});
