import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 246: notification transport uses NotificationApplicationPort only.
 * No NotificationUseCases dual alias.
 */
describe('notification transport application port single-track surface', () => {
  const dir = __dirname;
  const controller = readFileSync(resolve(dir, 'notification.controller.ts'), 'utf8');
  const index = readFileSync(resolve(dir, 'index.ts'), 'utf8');

  it('does not dual-alias NotificationUseCases', () => {
    expect(controller).toContain('NotificationApplicationPort');
    expect(controller).not.toContain('export type NotificationUseCases');
    expect(controller).not.toMatch(/NotificationUseCases\s*=\s*NotificationApplicationPort/);
    expect(index).not.toContain('NotificationUseCases');
  });
});
