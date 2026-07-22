import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 246: reminder transport uses ReminderApplicationPort only.
 * No ReminderUseCases dual alias.
 */
describe('reminder transport application port single-track surface', () => {
  const dir = __dirname;
  const controller = readFileSync(resolve(dir, 'reminder.controller.ts'), 'utf8');
  const index = readFileSync(resolve(dir, 'index.ts'), 'utf8');

  it('does not dual-alias ReminderUseCases', () => {
    expect(controller).toContain('ReminderApplicationPort');
    expect(controller).not.toContain('export type ReminderUseCases');
    expect(controller).not.toMatch(/ReminderUseCases\s*=\s*ReminderApplicationPort/);
    expect(index).not.toContain('ReminderUseCases');
  });
});
