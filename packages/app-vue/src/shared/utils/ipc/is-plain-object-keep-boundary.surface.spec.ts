import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { sanitizeForIpc } from './sanitize-for-ipc';

/**
 * Residual 1139: isPlainObject / isRecord keep-boundary.
 * - sanitize-for-ipc isPlainObject: Object.getPrototypeOf strict (Object.prototype | null only)
 * - desktop http-envelope isRecord: any non-null object (arrays allowed)
 * - the former app-vue AI isRecord helper is retired with the AgentHost workflow payload path
 * Soft residual 947: desktop local isRecord duals retired onto the package sole.
 * Does not flip §13.2 checkboxes.
 */
describe('isPlainObject/isRecord keep-boundary (residual 1139)', () => {
  const dir = __dirname;
  const sanitize = readFileSync(resolve(dir, 'sanitize-for-ipc.ts'), 'utf8');
  const retiredAISole = resolve(dir, '../../../modules/ai/composables/isRecord.ts');
  const desktopSole = readFileSync(
    resolve(dir, '../../../../../../apps/desktop/src/main/utils/http-envelope-guards.ts'),
    'utf8',
  );

  it('owns Residual 1139 keep-boundary markers on isPlainObject (prototype-strict)', () => {
    expect(sanitize).toContain('Residual 1139 keep-boundary');
    expect(sanitize).toMatch(/function isPlainObject\b/);
    expect(sanitize).toContain('Object.getPrototypeOf');
    expect(sanitize).toContain('Object.prototype');
    expect(sanitize).toContain('proto === null');
    // isPlainObject body must stay prototype-strict (not AI/desktop isRecord shapes)
    const body =
      sanitize.match(/function isPlainObject\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).toContain('Object.getPrototypeOf');
    expect(body).not.toContain('!Array.isArray');
    expect(body).not.toContain('Boolean(value)');
  });

  it('differs from the remaining desktop isRecord shape and keeps the retired AI helper absent', () => {
    expect(existsSync(retiredAISole)).toBe(false);

    expect(desktopSole).toContain('Soft residual 1139');
    expect(desktopSole).toMatch(/export function isRecord\b/);
    expect(desktopSole).toContain("value !== null && typeof value === 'object'");
    expect(desktopSole).not.toContain('Object.getPrototypeOf');
    expect(desktopSole).not.toContain('!Array.isArray(value)');

    // sanitize must not use the desktop isRecord sole body for isPlainObject
    const body =
      sanitize.match(/function isPlainObject\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).not.toContain("value !== null && typeof value === 'object'");
  });

  it('runtime: sanitize path stays IPC-safe without depending on the retired AI helper', () => {
    class Demo {
      x = 1;
    }
    // sanitizeForIpc still produces plain data for both plain objects and class instances
    expect(sanitizeForIpc({ a: 1 })).toEqual({ a: 1 });
    expect(sanitizeForIpc(new Demo())).toEqual({ x: 1 });
    expect(Array.isArray(sanitizeForIpc([1, 2]))).toBe(true);
  });

  it('documents residual 1139 lock intent without claiming §13.2 complete', () => {
    const self = readFileSync(
      resolve(dir, 'is-plain-object-keep-boundary.surface.spec.ts'),
      'utf8',
    );
    expect(self).toContain('Residual 1139');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('keep-boundary');
  });
});
